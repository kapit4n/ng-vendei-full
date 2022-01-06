import { Component, OnInit, Input } from "@angular/core";
import { VCategoriesService } from "../../../services/vendei/v-categories.service";
import { VConfigService } from "../../../services/vendei/v-config.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-category-list",
  templateUrl: "./category-list.component.html",
  styleUrls: ["./category-list.component.css"]
})
export class CategoryListComponent implements OnInit {
  @Input()
  selectedCategories: any[];
  @Input() recalTotal: Function;
  @Input() printOrderCount: number;

  productCode = "";
  originalP = [];
  categories = [
    { id: 0, name: "All", img: "https://image.flaticon.com/icons/svg/60/60833.svg" },
    { id: 1, name: "Gatgets", img: "https://image.shutterstock.com/image-photo/many-used-modern-electronic-gadgets-260nw-1457896685.jpg" },
    { id: 2, name: "Vegetables", img: "https://ichef.bbci.co.uk/news/660/cpsprodpb/5655/production/_94810122_istock-494702400.jpg" },
    { id: 3, name: "Books", img: "https://dailytimes.com.pk/assets/uploads/2019/04/22/books-521812297.jpg" },
    { id: 4, name: "Cars", img: "https://article.images.consumerreports.org/f_auto/prod/content/dam/CRO-Images-2020/Magazine/04April/CR-Magazine-Inline-hero-Top-picks-02-20" },
  ];

  displayCat = false;

  constructor(
    private categoriesSvc: VCategoriesService,
    public configSvc: VConfigService,
    private router: Router
  ) {}

  ngOnInit() {
    // this.categoriesSvc.getAll().subscribe(res => {
    //   this.categories = res;
    // });
  }

 

  filterByCategory(cat: any) {
   
  }

  openReports() {
    this.router.navigate(["/rep/products"]);
  }
  openRegister() {
    this.router.navigate(["/reg/products"]);
  }
  openMain() {
    this.router.navigate(["/main"]);
  }
}
