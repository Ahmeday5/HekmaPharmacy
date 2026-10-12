import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiUrl } from '../../../core/config/api.config';
import { ListQuery, PagedResult, PageRequest } from '../../../shared/models/pagination.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import {
  fetchAllPages,
  normalizePagedResult,
  notFoundAsEmptyPage,
} from '../../../shared/utils/pagination.util';
import { Deliveryman, DeliverymanFilters, DeliverymanPayload } from './deliveryman.models';

/** شكل البيانات الراجع من الـ backend (isAvaliable مكتوبة كده في الـ API) */
interface DeliverymanDto {
  id: number;
  name?: string;
  email?: string;
  isAvaliable?: boolean;
  imageUrl?: string | null;
  deviceToken?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DeliverymenApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('Dashboard');

  getPage({ page, pageSize, filters }: ListQuery<DeliverymanFilters>): Observable<PagedResult<Deliveryman>> {
    return this.fetchPage({ page, pageSize }, filters);
  }

  getAll(): Observable<Deliveryman[]> {
    return fetchAllPages((request) => this.fetchPage(request));
  }

  create(payload: DeliverymanPayload): Observable<void> {
    return this.http
      .post(`${this.baseUrl}/addDeliveryman`, toFormData(payload), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  update(id: number, payload: DeliverymanPayload): Observable<void> {
    return this.http
      .put(`${this.baseUrl}/updateDeliveryman/${id}`, toFormData(payload), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/deleteDeliveryman/${id}`, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private fetchPage(
    request: PageRequest,
    filters?: Partial<DeliverymanFilters>,
  ): Observable<PagedResult<Deliveryman>> {
    const params = toHttpParams({
      page: request.page,
      pageSize: request.pageSize,
      name: filters?.name,
      email: filters?.email,
    });
    return this.http
      .get<Partial<PagedResult<DeliverymanDto>> | null>(`${this.baseUrl}/getAllDeliverymen`, { params })
      .pipe(
        map((response) => normalizePagedResult(response, request, toDeliveryman)),
        notFoundAsEmptyPage(request),
      );
  }
}

function toDeliveryman(dto: DeliverymanDto): Deliveryman {
  return {
    id: dto.id,
    name: dto.name ?? '',
    email: dto.email ?? '',
    isAvailable: dto.isAvaliable ?? false,
    imageUrl: dto.imageUrl || null,
    deviceToken: dto.deviceToken || null,
  };
}

function toFormData(payload: DeliverymanPayload): FormData {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('email', payload.email);
  if (payload.password) {
    formData.append('password', payload.password);
  }
  if (payload.image) {
    formData.append('Image', payload.image, payload.image.name);
  }
  return formData;
}
