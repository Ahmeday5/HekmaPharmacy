import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { apiUrl } from '../../../core/config/api.config';
import { ListQuery, PagedResult } from '../../../shared/models/pagination.model';
import { notFoundAs, paginateLocally } from '../../../shared/utils/pagination.util';
import {
  Admin,
  AdminFilters,
  CreateAdminPayload,
  normalizeAdminRole,
  UpdateAdminPayload,
} from './admin.models';

/** الـ backend مش ثابت في اسم/شكل حقل الدور — بندعم كل الأشكال المعروفة */
type RoleValue = string | { name?: string; roleName?: string } | null | undefined;

interface AdminDto {
  id: string;
  userName?: string;
  email?: string;
  role?: RoleValue;
  roles?: RoleValue | RoleValue[];
  roleName?: string;
  userRoles?: RoleValue[];
}

@Injectable({ providedIn: 'root' })
export class AdminsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('Dashboard');

  /** الـ endpoint بيرجع كل المستخدمين — البحث والـ pagination بيتعملوا هنا */
  getPage({ page, pageSize, filters }: ListQuery<AdminFilters>): Observable<PagedResult<Admin>> {
    const term = filters.search.trim().toLowerCase();
    return this.getAll().pipe(
      map((admins) =>
        admins.filter(
          (a) =>
            (!filters.role || a.role === filters.role) &&
            (!term || a.email.toLowerCase().includes(term) || a.userName.toLowerCase().includes(term)),
        ),
      ),
      map((admins) => paginateLocally(admins, { page, pageSize })),
    );
  }

  getAll(): Observable<Admin[]> {
    return this.http.get<AdminDto[] | null>(`${this.baseUrl}/getAllAppUsers`).pipe(
      notFoundAs(() => [] as AdminDto[]),
      map((dtos) => (dtos ?? []).map(toAdmin)),
      switchMap((admins) => this.withMissingRoles(admins)),
    );
  }

  create(payload: CreateAdminPayload): Observable<void> {
    return this.http
      .post(`${this.baseUrl}/addAppUser`, payload, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  update(id: string, payload: UpdateAdminPayload): Observable<void> {
    return this.http
      .put(`${this.baseUrl}/updateAppUser/${id}`, payload, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/deleteAppUser/${id}`, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  /**
   * لو الليستة راجعة من غير الدور، بنجيبه من getAppUserById للمستخدمين دول بس.
   * أي فشل في التفاصيل ما يوقفش الجدول — المستخدم يظهر من غير دور.
   */
  private withMissingRoles(admins: Admin[]): Observable<Admin[]> {
    const missing = admins.filter((admin) => !admin.role);
    if (missing.length === 0) {
      return of(admins);
    }
    const details$ = missing.map((admin) =>
      this.http.get<AdminDto>(`${this.baseUrl}/getAppUserById/${admin.id}`).pipe(
        map((dto) => extractRole(dto)),
        catchError(() => of('')),
      ),
    );
    return forkJoin(details$).pipe(
      map((roles) => {
        const roleById = new Map(missing.map((admin, i) => [admin.id, roles[i]]));
        return admins.map((admin) => (admin.role ? admin : { ...admin, role: roleById.get(admin.id) ?? '' }));
      }),
    );
  }
}

function toAdmin(dto: AdminDto): Admin {
  return {
    id: dto.id,
    userName: dto.userName ?? '',
    email: dto.email ?? '',
    role: extractRole(dto),
  };
}

function extractRole(dto: AdminDto): string {
  const candidates = [dto.role, dto.roleName, dto.roles, dto.userRoles].flat();
  for (const candidate of candidates) {
    const role = typeof candidate === 'string' ? candidate : (candidate?.name ?? candidate?.roleName);
    if (role?.trim()) {
      return normalizeAdminRole(role.trim());
    }
  }
  return '';
}
