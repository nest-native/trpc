import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

void bootstrapApplication(AppComponent).catch((error: unknown) => {
  console.error(error);
});
