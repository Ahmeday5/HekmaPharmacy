import { InjectionToken } from '@angular/core';

/** بيتوفر من app-list-view: الجدول جوه كارت فبيترسم من غير إطار وظل خاص بيه */
export const EMBEDDED_TABLE = new InjectionToken<boolean>('EMBEDDED_TABLE');
