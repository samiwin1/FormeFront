import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from './header.component';

xdescribe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const authServiceMock = { logout: jasmine.createSpy('logout') };
  const httpClientMock = {
    get: jasmine.createSpy('get'),
    post: jasmine.createSpy('post'),
    put: jasmine.createSpy('put'),
    delete: jasmine.createSpy('delete')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: HttpClient, useValue: httpClientMock }]
    })
    .overrideComponent(HeaderComponent, {
      set: {
        template: '<div></div>',
        providers: [{ provide: AuthService, useValue: authServiceMock }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
