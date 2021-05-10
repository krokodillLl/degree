import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import 'rxjs/add/operator/map';


/**
 * Сервис для общения с бэкэндом
 * */
@Injectable()
export class HttpService {

  constructor(private http: HttpClient) {
  }


}
