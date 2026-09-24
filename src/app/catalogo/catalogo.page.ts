import { Component, OnInit } from '@angular/core';
import { AuthService, RentRoomUser } from '../services/auth.service';
import { ProductService, RentRoomProduct } from '../services/product.service';

@Component({ selector: 'app-catalogo', templateUrl: './catalogo.page.html', styleUrls: ['./catalogo.page.scss'], standalone: false })
export class CatalogoPage implements OnInit {
  products: RentRoomProduct[] = [];
  currentUser: RentRoomUser | null = null;
  editingId: number | null = null;
  message = '';
  form = { name: '', description: '', category: '', purchaseValue: 0, rentalValue: 0, guarantee: 0, imageUrl: '' };
  constructor(private productService: ProductService, private authService: AuthService) {}
  ngOnInit() { this.refresh(); }
  ionViewWillEnter() { this.refresh(); }
  get isOwner(): boolean { return this.currentUser?.role === 'PROPIETARIO'; }
  saveProduct() {
    if (!this.currentUser || !this.isOwner) { this.message = 'Debes iniciar sesión como Propietario.'; return; }
    if (!this.form.name.trim() || !this.form.category.trim() || this.form.rentalValue <= 0) { this.message = 'Completa nombre, categoría y valor de arriendo.'; return; }
    if (this.editingId) {
      const p = this.products.find(x => x.id === this.editingId && x.ownerEmail === this.currentUser?.email);
      if (p) { this.productService.update({ ...p, ...this.form }); this.message = 'Producto actualizado correctamente.'; }
    } else { this.productService.create({ ...this.form, ownerEmail: this.currentUser.email }); this.message = 'Producto publicado correctamente.'; }
    this.cancelEdit(); this.refresh();
  }
  editProduct(p: RentRoomProduct) { if (p.ownerEmail !== this.currentUser?.email) return; this.editingId = p.id; this.form = { name:p.name, description:p.description, category:p.category, purchaseValue:p.purchaseValue, rentalValue:p.rentalValue, guarantee:p.guarantee, imageUrl:p.imageUrl }; }
  deleteProduct(p: RentRoomProduct) { if (this.currentUser && p.ownerEmail === this.currentUser.email) { this.productService.remove(p.id, this.currentUser.email); this.message='Producto eliminado correctamente.'; this.refresh(); } }
  cancelEdit() { this.editingId=null; this.form={ name:'', description:'', category:'', purchaseValue:0, rentalValue:0, guarantee:0, imageUrl:'' }; }
  isMine(p: RentRoomProduct): boolean { return p.ownerEmail === this.currentUser?.email; }
  private refresh() { this.currentUser=this.authService.getCurrentUser(); this.products=this.productService.getAll(); }
}
