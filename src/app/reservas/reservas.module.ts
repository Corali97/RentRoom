import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { ReservasRoutingModule } from './reservas-routing.module';
import { ReservasPage } from './reservas.page';
@NgModule({ imports: [CommonModule, FormsModule, IonicModule, ReservasRoutingModule], declarations: [ReservasPage] })
export class ReservasPageModule {}
