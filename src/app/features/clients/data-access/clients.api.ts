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
import { Client, ClientFilters, ClientPayload } from './client.models';

@Injectable({ providedIn: 'root' })
export class ClientsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('Dashboard');

  getPage({ page, pageSize, filters }: ListQuery<ClientFilters>): Observable<PagedResult<Client>> {
    return this.fetchPage({ page, pageSize }, filters.name);
  }

  /** كل العملاء (للقوائم المنسدلة) */
  getAll(): Observable<Client[]> {
    return fetchAllPages((request) => this.fetchPage(request));
  }

  create(payload: ClientPayload): Observable<void> {
    return this.http
      .post(`${this.baseUrl}/addClient`, payload, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  update(id: number, payload: ClientPayload): Observable<void> {
    return this.http
      .put(`${this.baseUrl}/updateClient/${id}`, payload, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/deleteClient/${id}`, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private fetchPage(request: PageRequest, name?: string): Observable<PagedResult<Client>> {
    const params = toHttpParams({ page: request.page, pageSize: request.pageSize, name });
    return this.http
      .get<Partial<PagedResult<Client>> | null>(`${this.baseUrl}/getAllClients`, { params })
      .pipe(
        map((response) => normalizePagedResult(response, request, toClient)),
        notFoundAsEmptyPage(request),
      );
  }
}

function toClient(dto: Partial<Client>): Client {
  return {
    id: dto.id ?? 0,
    clientCode: dto.clientCode ?? '',
    name: dto.name ?? '',
    phoneNumber: dto.phoneNumber ?? '',
    phoneNumber02: dto.phoneNumber02 ?? '',
    address: dto.address ?? '',
    address02: dto.address02 ?? '',
    location: dto.location ?? '',
  };
}
