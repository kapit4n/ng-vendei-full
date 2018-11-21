import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

import { RepSellsService, ISell } from "../../../services/rep/rep-sells.service";

@Component({
  selector: 'app-rep-sells',
  templateUrl: './rep-sells.component.html',
  styleUrls: ['./rep-sells.component.css']
})
export class RepSellsComponent implements OnInit {

  sells: ISell[];
  constructor(
    private sellsSrv: RepSellsService,
    private router: Router) {
    this.sells = [];
  }

  ngOnInit() {
    this.sellsSrv.getAll().subscribe(p => (this.sells = p));
  }

  openSellRep(sellId: string) {
    this.router.navigate(["/inv/sells/" + sellId]);
  }
}
