var assert=require('assert');
var color = require("ansi-color");
//function assert(cond,message) {}

function debuglog(str) {

}

function MetaCell(row,col,nbR,nbC,sudoku) {
    this.row = row;
    this.col = col;
    this.nbRow  = nbR;
    this.nbCol  = nbC;
    this.cells  = sudoku.cells; 
    this.parent = sudoku;
}

MetaCell.prototype.cell = function(i,j) {
  assert(i>=0 && i<this.nbRow);
  assert(j>=0 && j<this.nbCol); 
  var ii = this.row+ i;
  var jj = this.col+ j;
  return this.parent.cell(ii,jj);
};

MetaCell.prototype.get_known_values = function () {
   var a=[];
   var i,j;
   for (i = 0;i< this.nbRow; i++) {
    for (j = 0;j< this.nbCol; j++) {
     var c = this.cell(i,j);
     assert(c," canno find cells at " + i + "," + j);
     if (c.isKnown()) {
       a.push(c.value());
     }
  }
  }
  return a;  
};

MetaCell.prototype.get_unknown_values = function () {
  var b=[];
  var a=this.get_known_values();
  var s = this.parent;
  s.symbols.split('').forEach(function(value) {
      if (a.lastIndexOf(value) === -1 ) {
      b.push(value);
    }
  });
  return b;  
}; 

MetaCell.prototype.updateUnknownCells = function() {
  var i,j;
  // collect value that are sets
  var a = this.get_known_values();

  // console.log(" known values " ,a );
  for (i = 0;i< this.nbRow; i++) {
    for (j = 0;j< this.nbCol; j++) {
     var c = this.cell(i,j);
     if ( !c.isKnown()) {
        c.excludeValues(a);
      if (c.possibleValues.length === 0 ) {
          return ; // cannot solve
      }
      assert(c.possibleValues.length>0," We have excluded the only possible value",c);
     }
  }
  }
};

MetaCell.prototype.Update = function() {
  this.updateUnknownCells();
  this.updateUnknownCells();
    // deductions
  this.performDeductions();
  
};

MetaCell.prototype.find_possible_cells = function(value) {
   var res=[];  
   var i,j;
   for (i = 0;i< this.nbRow; i++) {
      for (j = 0;j< this.nbCol; j++) {
      var c = this.cell(i,j);
    if (c.possibleValues.lastIndexOf(value) !== -1) {
       res.push(c);
    }
    }
   }
   return res;
};

MetaCell.prototype.print = function(){
  var i,j,c;
  for (i = 0;i< this.nbRow; i++) {
      var str ="";
      for (j = 0;j< this.nbCol; j++) {
        c = this.cell(i,j);
        if (c.isKnown()) str = str + c.value(); else str=str+".";
      }
      console.log(str);
   }
};

MetaCell.prototype.performDeductions = function(){
   // find
  var that =this;
  var b = this.get_unknown_values();  
    // console.log(b);  
    // this.print();
  b.forEach(function(value){
      var res = that.find_possible_cells(value);
    //assert(res.length!=0," cannot find candidate cells for " + value + " in meta cell" + that.row + "[" + that.nbRow + "]," +that.col+"["+that.nbCol+"]");
    if (res.length===1) {
        var c = res[0];
          //xx console.log(" Only Choice !" ,value,c.row,",",c.col,c.possibleValues)
      c.setKnown(value);
    }
  }); 
};

function Cell(row,col,sudoku) {

    this.row = row;
    this.col = col;
    this.possibleValues =  sudoku.symbols.split('');
  this.parent = sudoku;
}

Cell.prototype.isKnown = function () {
  return (this.possibleValues.length === 1);
};

Cell.prototype.value  = function() {
  assert(this.possibleValues.length === 1," cell has no value yet " + this.possibleValues);
  return this.possibleValues[0];
};

Cell.prototype.setKnown  = function (value) {
  if (this.possibleValues.length!==1) {
  this.parent.nb_known_cells++;
  this.possibleValues  = [ value];
  } else {
    assert(this.value()== value," trying to force a different value old value="+this.value() + " " + value);
  }
};

Cell.prototype.excludeValue = function (value) {
 var lbefore = this.possibleValues.length
 this.possibleValues = this.possibleValues.filter(function(a){ return a!==value; });
 if (this.possibleValues.length === 0 ) {
     this.parent.setUnsolvable(" removing too many values " + value + " at cell "+this.row+","+this.col);
   return;
 }
 if (this.possibleValues.length === 1 && lbefore == 2) {
   this.parent.nb_known_cells++;
   //xx console.log(" after excluding ", value, " setting cell ",this.row,",",this.col," = " , this.value());
 }
 if (this.possibleValues.length === 0 ) {
    console.log(" EXCESSIVE EXCLUDED ",lbefore,value );
 }
};

Cell.prototype.excludeValues = function (values) {
    var that=this;
  if (this.parent.isUnsolvable()) return;
  values.forEach(function(v){ that.excludeValue(v); });
};


function Sudoku(dimension) { 
  this.dim = dimension;
  this.dim2 = dimension*dimension;
  this.errorMessage = undefined;
  this.nb_known_cells = 0;   
  this.symbols= "123456789ABCDEF0".substr(0,this.dim2);
  console.warn(this.symbols);
  this.cells = [];
  this.metaCells = [];
  var i,j=0,cc;
  
  // construct cell matrix
  for ( i = 0 ; i< this.dim2 ;i++) {
    for ( j = 0 ; j< this.dim2 ;j++) {
        this.cells[i*this.dim2+j] = new Cell(i,j,this);
    }  
  }
  // squared cells
  for ( i=0;i<this.dim ;i++ ) {
      for ( j=0;j<this.dim ;j++ ) {
        cc = new MetaCell(i*this.dim,j*this.dim,this.dim,this.dim,this);
        this.metaCells.push(cc);
      }
  }
  // lines
  for ( i=0;i<this.dim2 ;i++ ) {
    cc = new MetaCell(i,0,1,this.dim2,this);
    this.metaCells.push(cc);
  cc = new MetaCell(0,i,this.dim2,1,this);
    this.metaCells.push(cc);
  }

}

Sudoku.prototype.cell =function(i,j) {
  assert(i>=0 && i < this.dim2 );
  assert(j>=0 && j < this.dim2 );
  return this.cells[i*this.dim2+j] ;
};

Sudoku.prototype.isSolved  = function() {
  return this.nb_known_cells === this.dim2*this.dim2;
};
Sudoku.prototype.isUnsolvable   = function() {
   return this.errorMessage;
};

Sudoku.prototype.setUnsolvable  = function(message) {
   this.errorMessage = message;
}

Sudoku.prototype.initRow = function( row,str){
  //console.log(this)
  var j=0;
  var that = this;
  str.split('').forEach(function(a) {
     var c = that.cell(row,j);
     if (a!='.') {
        c.setKnown(a);
   }
   j++;
  });
  
};

Sudoku.prototype.init = function(str) {
  var that = this;
  var row =0;
  str.split('|').forEach(function(line) {
     that.initRow(row,line);
     row++;
  });
};

Sudoku.prototype.Update = function() {
   //var that =this;
   var n = this.nb_known_cells;
   
   this.metaCells.forEach(function(m) {
    m.Update();
   });
   return  (this.nb_known_cells !== n); // true if some cells have been solved
};

function print_sudoku(sudoku) {
  var i,j;
  for( i=0;i<sudoku.dim2;i++) {
    if (i%sudoku.dim===0) { console.warn("+-----------------------------+"); }
  var str = "";
  for( j=0;j<sudoku.dim2;j++) {
    if (j%sudoku.dim===0) { str += '|'; }
      var c= sudoku.cell(i,j);
    if (c.isKnown()) {
       str = str + " " + c.value() + " ";
    } else {
       str = str + " . ";
    }
  }
  str +="|";
  console.warn(str);
  }
  console.warn("+-----------------------------+"); 
}  
 
function cv(cell,value) {
   if (cell.isKnown() )  {
     if (value != '5') 
      return ' .';
   else 
    return "" +color.set(' '+ cell.value(),"green+bold");
   }
   if (cell.possibleValues.lastIndexOf(value)===-1) {
      return ' .';
   }
   if (cell.isKnown()) {
      return "" +color.set(' '+ value,"green+bold");
   } else {
     return color.set(' '+value,"red");
   }
 }

function print_2(sudoku) {
  console.warn("+-----------------------------------------------------------------+"); 
  var i,j;
  for( i=0;i<sudoku.dim2;i++) {
    if (i%sudoku.dim===0) { console.warn("+-----------------------------------------------------------------+"); }
  var str1 = "";
  var str2 = "";
  var str3 = "";
  for( j=0;j<sudoku.dim2;j++) {
    if (j%sudoku.dim===0) { 
    str1 += '|'; 
    str2 += '|'; 
    str3 += '|'; 
    }
    var c= sudoku.cell(i,j);
    
    str1 = str1 + cv(c,'1');
    str1 = str1 + cv(c,'2');
    str1 = str1 + cv(c,'3');
    str2 = str2 + cv(c,'4');
    str2 = str2 + cv(c,'5');
    str2 = str2 + cv(c,'6');
    str3 = str3 + cv(c,'7');
    str3 = str3 + cv(c,'8');
    str3 = str3 + cv(c,'9');
 
      str1 = str1 + '|';
      str2 = str2 + '|';
      str3 = str3 + '|';
  }
  str1 +="|";
  str2 +="|";
  str3 +="|";
  console.warn(str1);
  console.warn(str2);
  console.warn(str3);
    console.warn("+-----------------------------------------------------------------+"); 
  }
  console.warn("+-----------------------------------------------------------------+"); 
  console.warn("");  
 }

Sudoku.prototype.asString = function () {
   var str="";
   var i,j;
   for( i=0;i<this.dim2;i++) {
     for( j=0;j<this.dim2;j++) { 
      var c = this.cell(i,j);
    if (c.isKnown()) {
     str += c.value();
    } else {
      str += ".";
    }
    
   }
   str += "|";
  }
  return str;
   
};

Sudoku.prototype.getDeepCopy = function() {
  var newS = new Sudoku(this.dim);
  newS.init(this.asString());
  return newS;
};

function solve_Sudoku(str) {
  var s = new Sudoku(3);
  s.init(str);
  var counter = 0;
  
  var stack = [];
  stack.push(s);  
  while(stack.length) {
      s = stack.pop();
    while(s.Update()) {  counter ++; /*print_sudoku(s); */ }
  
    if (s.isSolved()) {
     print_2(s);
      console.log(" sorted in ", counter," rounds");
      console.log(s.asString());
     return;
    }
    // if not fully solved
    // find cells with only 2 possibles values
    var cc  = s.cells.filter(function(c){ return c.possibleValues.length===2; });
    // if none => we don't know how to solve yet
    if (cc.length===0) {
     cc  = s.cells.filter(function(c){ return c.possibleValues.length==3; });
    }
    // console.log(cc);
    // take one at random
    var cell = cc[0];
  
    // add two branches 
    cell.possibleValues.forEach(function(value) {
       var ss = s.getDeepCopy();
       ss.cell(cell.row,cell.col).setKnown(value);
       console.log(" pushing ",ss.asString());
        stack.push(ss);
    });  
      console.log(" poping ",s.asString());
  }
  
}

function rand(maxValue) {
  var r =  Math.round(Math.random()*maxValue);
  if (r<=0 ) r=0;
  if (r>=maxValue) r = maxValue-1;
  return r;
}

function build_sudoku() {
   var dim = 3;
   var s   = new Sudoku(dim);
   var sol = new Sudoku(dim);
   var count =0;
   while(s.nb_known_cells !== s.dim2*s.dim2) {
       while(s.Update()) {
      console.log(" solving ");
    }
    console.log(" solved");
      // find a unkown cell at random
    var unknown_cells =  s.cells.filter(function(c){  return !c.isKnown(); })
    if (unknown_cells.length===0) { console.log(" anormal break",s.nb_known_cells );break; }
    
    var i = rand(unknown_cells.length);
   
    var c = unknown_cells[i]; 
     console.log(" looking at ",i,unknown_cells.length," ",c.row,c.col);
    if (!c) {
       console.log("i=",i,unknown_cells);
    }
    var ps = c.possibleValues;
    var j = rand(ps.length);
    var value = ps[j];
    c.setKnown(value);
    sol.cell(c.row,c.col).setKnown(value);
    count ++;

 
   }
   print_2(sol);
   console.warn( "avec ",count," cellules");
}
// solve_Sudoku("..9.15.7.|.3.72.1..|..48.35..|.7856.2..|1.......5|..3.4271.|..61.93..|..7.84.5.|.8.63.4..");

//solve_Sudoku(".42375.9.|..91..245|.5.4....7|23...4786|4.7.3..59|...8.7...|.1.653..2|.6.....3.|923781.64");

//solve_Sudoku("16..9....|..2...9..|4.....1.2|....89..7|6...324.8|..7.....1|...647.2.|.......4.|.3......9");

// very difficult  
//solve_Sudoku(".......27|....643.5|9....1...|..2...75.|..4.....8|6...95...|..958...2|.1.3.....|.8...6...");
solve_Sudoku("..41.....|9....53..|.3...6..5|..8.9.4..|..53..6..|.2....8..|.5..6.1..|7....2.49|........2");
 
 //solve_Sudoku(".798..3..|5....9...|.1....2..|...9...28|8..2.7...|.6.......|.5.68..4.|....1..93|.24.....1");
 // solve_Sudoku("34.67....|7.9.1....|1...4.372|2...8.1..|......6..|91.43.8..|8.5.6.419|6...5....|4...2....");
//build_sudoku();


// femina
// Diabolique 1
//solve_Sudoku("...7.....|..1.3.6..|......4.3|23...489.|8....3..5|..5..9...|..8..75.6|.5...2..8|71..65.29");
// solve_Sudoku("..6......|5..4....8|38.......|....1.6.7|9...2...4|7..846.12|..2....5.|.7.2.3.4.|.3.9..7.6");
// solve_Sudoku("3698.7..1|......7..|7.5...3..|97...2.5.|...9...3.|2.4.3....|..83..6.2|.12......|.37.68..9");

// difficile
//solve_Sudoku("....4....|.91....8.|.....6.23|..6......|8...7.1..|.75.2....|92.3..5..|..49...1.|.138...4.");
//solve_Sudoku(".9......1|....9136.|.1.68..7.|..2...6..|....2..85|8..5...32|..9.7.523|2..9...4.|1...5.796");
//solve_Sudoku("...8..4..|...9..7..|..5....98|6..7.....|....1.23.|45...2...|16839....|2.......3|.4.....19");

// Moyen
// OK solve_Sudoku("..9....21|.4.....65|7..42..98|3.....9..|......237|2..936.8.|..8.1.67.|......8.3|.7.26..19");

