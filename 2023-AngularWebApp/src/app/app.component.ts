import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Auth0AngularDemo';
  constructor(public auth: AuthService, private http: HttpClient) { }
  weatherItems: any = [];

  ngOnInit() {
    this.http.get(environment.apiUrl).subscribe((reply) => {
      console.log('data');
        this.weatherItems = reply;
    });
  }
}
