import { Pipe, PipeTransform } from '@angular/core';
import { apiAssetUrl } from '../../core/config/api.config';

/** {{ deliveryman.imageUrl | apiAsset }} → رابط كامل على سيرفر الـ API */
@Pipe({ name: 'apiAsset', standalone: true })
export class ApiAssetPipe implements PipeTransform {
  transform(path: string | null | undefined): string | null {
    return apiAssetUrl(path);
  }
}
