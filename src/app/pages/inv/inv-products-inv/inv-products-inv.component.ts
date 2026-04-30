import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { IProductsService } from "../../../services/inv/i-products.service";
import { IProductsInvService } from "../../../services/inv/i-products-inv.service";
import { finalize } from "rxjs/operators";
//import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "app-inv-products-inv",
    templateUrl: "./inv-products-inv.component.html",
    styleUrls: ["./inv-products-inv.component.css"],
    standalone: false
})
export class InvProductsInvComponent implements OnInit {
  invInfo: any = {};
  productInvs: any[] = [];
  invItemInfo: any = {};
  closeResult: string;
  loadingProductInvs = true;
  constructor(
    private route: ActivatedRoute,
    //private modalService: NgbModal,
    private productSvc: IProductsService,
    private productInvSvc: IProductsInvService,
    private router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    
  }

  ngOnInit() {
    let id = this.route.snapshot.paramMap.get("id");
    if (id != "new") {
      this.loadInvInfo(id);
      this.loadProductInvs(id);
    }
  }

  open(content) {
    /**
     * 
    this.modalService.open(content).result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
     */
  }

  goBack(): void {
    this.router.navigate(["/inv/products"]);
  }

  private getDismissReason(reason: any): string {
    // if (reason === ModalDismissReasons.ESC) {
    //   return "by pressing ESC";
    // } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
    //   return "by clicking on a backdrop";
    // } else {
    //   return `with: ${reason}`;
    // }

    throw Error("Change to material dialog")
  }

  loadInvInfo(id: string) {
    this.productSvc.getById(id).subscribe(inv => {
      this.invInfo = inv;
      this.invItemInfo.price = this.invInfo.cost;
    });
  }

  loadProductInvs(id: string) {
    this.productInvSvc.getByProductId(id).pipe(finalize(() => {
      this.loadingProductInvs = false;
      this.cdr.detectChanges();
    })).subscribe(invs => {
      this.productInvs = invs;
    });
  }

  saveInvItem() {
    if (!this.invInfo?.id) {
      return;
    }
    const q = Number(this.invItemInfo.quantity);
    const p = Number(this.invItemInfo.price);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0) {
      return;
    }
    this.invItemInfo.totalPrice = this.invItemInfo.quantity * this.invItemInfo.price;
    this.invItemInfo.productId = this.invInfo.id;

    this.productInvSvc.save(this.invItemInfo).subscribe(product => {
      this.loadProductInvs(this.invInfo.id);
    });
    this.productSvc
      .addToInventory(this.invInfo.id, Number(this.invItemInfo.quantity))
      .subscribe(res => {
        console.log(res);
        this.loadInvInfo(this.invInfo.id);
      });
    this.invItemInfo.quantity = "";
  }

  delInvItem(invItem: any) {
    this.productSvc.reduceInventory(this.invInfo.id, Number(invItem.quantity)).subscribe(res => {
      console.log(res);
      this.loadInvInfo(this.invInfo.id);
    });

    this.productInvSvc.remove(invItem.id).subscribe(product => {
      this.loadProductInvs(this.invInfo.id);
    });
  }
}
