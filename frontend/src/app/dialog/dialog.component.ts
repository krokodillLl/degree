import {Component, OnInit} from '@angular/core';
import {HttpService} from '../http.service';
import {SafeResourceUrl} from '@angular/platform-browser';

/**
 * Компонент, отвечающий за страницу диалога
 * */
@Component({
  selector: 'dialog-component',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit {

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {

  }
}
