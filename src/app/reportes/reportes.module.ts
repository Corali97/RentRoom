import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { IonicModule } from '@ionic/angular/lazy';

import { ReportesPage } from './reportes.page';

const routes: Routes = [{ path: '', component: ReportesPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ReportesPage]
})
export class ReportesPageModule {}
