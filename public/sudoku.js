(function(exports){
    

// var assert=require('assert');

function assert(cond,message) {
    if (!cond ){ 
        throw new Error( message);
    }
}

function debuglog(str) {

}

/**
 * MetaCell constructor 
 * 
 */
function MetaCell(row, col, nbR, nbC, sudoku) {
    this.row = row;
    this.col = col;
    this.nbRow = nbR;
    this.nbCol = nbC;
    this.__cells = sudoku.cells;
    this.parent = sudoku;
}

MetaCell.prototype.cell = function(i, j) {
    assert(i >= 0 && i < this.nbRow);
    assert(j >= 0 && j < this.nbCol);
    var ii = this.row + i;
    var jj = this.col + j;
    return this.parent.cell(ii, jj);
};
/**
 * retrieve an array of all known values of the meta cell
 */
MetaCell.prototype.get_known_values = function() {
    var known_values = [];
    var i, j;
    for (i = 0; i < this.nbRow; i++) {
        for (j = 0; j < this.nbCol; j++) {
            var c = this.cell(i, j);
            assert(c, " cannot find cells at " + i + "," + j);
            if (c.isKnown()) {
                known_values.push(c.value());
            }
        }
    }
    return known_values;
};

MetaCell.prototype.get_unknown_values = function() {
    var unknown_values = [];
    var known_values = this.get_known_values();
    var s = this.parent;
    s.symbols.forEach(function(value) {
        if (known_values.lastIndexOf(value) === -1) {
            unknown_values.push(value);
        }
    });
    return unknown_values;
};

MetaCell.prototype.updateUnknownCells = function() {

    var i, j;

    // collectvalues that are already known in this zone
    var known_values = this.get_known_values();

    // console.log(" known values " ,a );
    for (i = 0; i < this.nbRow; i++) {
        for (j = 0; j < this.nbCol; j++) {
            var c = this.cell(i, j);
            if (!c.isKnown()) {
                c.excludeValues(known_values);
                // if (c.possibleValues.length === 0) {
                //     // there is a contradiction here
                //     assert( false, " should not get there !!!");
                //     return false; // cannot solve
                // }
                assert(c.possibleValues.length > 0, " We have excluded the only possible value", c);
            }
        }
    }
    return true;
};

MetaCell.prototype.update = function() {
    this.updateUnknownCells();
    this.updateUnknownCells();
    // deductions
    this.performDeductions();

};


MetaCell.prototype.get_cells = function() {
    
    var i,j;
    var arr = [];
    for (i = 0; i < this.nbRow; i++) {
        for (j = 0; j < this.nbCol; j++) {
            arr.push(this.cell(i, j));
        }
    }
    return arr;
};

/**
 * return true if arr1 and arr2 are two arrays that contains the same
 * set of elements
 */
function same_array(arr1,arr2) {
    return arr1.toString() == arr2.toString();
}
function partition(arr, compare_func) {
    
    var sim = [];
    var unsim = [];
    
    arr.forEach(function(e) {
       if ( compare_func(e))  {
           sim.push(e);
       } else {
           unsim.push(e);
       }
    });
    return  [ sim, unsim];
}

MetaCell.prototype.detect_naked_pairs = function() {
    
    // https://www.sudokuoftheday.com/techniques/naked-pairs-triples/
    // Find naked pair in the meta cell.
    // A naked pair is a pair of cells belonging to the metacell that have
    // the same 2 unknown values

    var pairs = [];
    
    var cells = this.get_cells();
    
    var cells_with_two_unknowns = cells.filter(function(c) { 
        return c.possibleValues.length === 2;
    });
    
    while(true) {
        
        if (cells_with_two_unknowns.length <= 1) {
            return pairs; // no pairs
        }
        // now try to put them together
        
        // remove first element:
        var el = cells_with_two_unknowns.shift();
        
        // now try to find similar
        var r = partition(cells_with_two_unknowns,function(c) {
            return same_array(c.possibleValues,el.possibleValues);
        });
        
        var sim = r[0];
        cells_with_two_unknowns = r[1];
        
        if (sim.length === 1) {
            pairs.push({ values: el.possibleValues ,cells: [ el , sim[0]] });
        }
        
        //xx console.log(cells_with_two_unknowns);        
    }

};

/**
 * detect candidate Lines in a square cell.
 *  
 * find a value in a square cell that can only be set in a specific
 * row or column.
 * 
 * i.e : find that the =4= value can only be in the second column of
 *       the square meta cell at position (2,2)
 * 
 * +-----------------------------------------------------------------+
 * | . 2 .| . 2 .|      ||      |      |      || . 2 .|      |      ||
 * | 4 . .| 4 . .|   1  ||   9  |   5  |   7  || 4 . .|   6  |   3  ||
 * | . 8 .| . 8 .|      ||      |      |      || . . .|      |      ||
 * +-----------------------------------------------------------------+
 * | . 2 .| . 2 3| . . 3||      | . 2 .|      || 1 2 .|      | 1 2 .||
 * | 4 5 .| 4 . .| . 5 .||   8  | 4 . .|   6  || 4 . .|   7  | 4 . .||
 * | . . .| . . .| . . .||      | . . .|      || . . 9|      | . . 9||
 * +-----------------------------------------------------------------+
 * |      |      |      ||      |      | . 2 .||      | . 2 .|      ||
 * |   7  |   6  |   9  ||   1  |   3  | 4 . .||   8  |/4/. .|   5  ||
 * |      |      |      ||      |      | . . .||      | . . .|      ||
 * +-----------------------------------------------------------------+
 * +-----------------------------------------------------------------+
 * | . . .| . . .|      ||      |      |      ||      |      | . . .||
 * | 4 . .| 4 . .|   7  ||   2  |   6  |   1  ||   3  |   5  | 4 . .||
 * | . 8 9| . 8 .|      ||      |      |      ||      |      | . . 9||
 * +-----------------------------------------------------------------+
 * |      |      |      ||      |      |      ||      |      |      ||
 * |   3  |   1  |   2  ||   4  |   9  |   5  ||   7  |   8  |   6  ||
 * |      |      |      ||      |      |      ||      |      |      ||
 * +-----------------------------------------------------------------+
 * | . . .|      |      ||      |      |      || 1 2 .| 1 2 .| 1 2 .||
 * | 4 . .|   5  |   6  ||   3  |   7  |   8  || 4 . .|/4/. .| 4 . .||
 * | . . 9|      |      ||      |      |      || . . 9| . . 9| . . 9||
 * +-----------------------------------------------------------------+
 * +-----------------------------------------------------------------+
 * |      | . 2 3|      ||      | . 2 .|      ||      | . 2 3|      ||
 * |   1  | . . .|   8  ||   6  | 4 . .|   9  ||   5  |=4=. .|   7  ||
 * |      | . . .|      ||      | . . .|      ||      | . . .|      ||
 * +-----------------------------------------------------------------+
 * | . 2 .|      | . . 3||      |      | . 2 .||      | . 2 3|      ||
 * | . 5 .|   9  | . 5 .||   7  |   1  | 4 . .||   6  |=4=. .|   8  ||
 * | . . .|      | . . .||      |      | . . .||      | . . .|      ||
 * +-----------------------------------------------------------------+
 * |      |      |      ||      |      |      || 1 2 .| 1 2 .| 1 2 .||
 * |   6  |   7  |   4  ||   5  |   8  |   3  || . . .| . . .| . . .||
 * |      |      |      ||      |      |      || . . 9| . . 9| . . 9||
 * +-----------------------------------------------------------------+
 *                                             \                     /
 *                                              \--------  ---------/
 *                                                       \/
 *                                                  (meta cell 2,2)
 */
MetaCell.prototype.detect_candidate_lines = function() {
   
    assert(this.isSquare === true);
       
    var self = this;
    var candidate_lines = [];
    
    // scan all availables symbols
    var symbols = this.parent.symbols.slice(0); 
    
    symbols.forEach(function(value){
        
        var possible_cells = self.find_possible_cells(value);
        
        if (possible_cells.length > 1) {
            // check if possible_cells share the same columns or line
            var test_col = possible_cells[0].col;
            var test_row = possible_cells[0].row;
            
            possible_cells.forEach(function(cell) {
                if (test_col !=-1 && test_col !== cell.col) {
                    test_col = -1; // not in a col
                }
                if (test_row !=-1 && test_row !== cell.row) {
                    test_row = -1; // not in a col
                }
                
            });
            
            if (test_col !== -1 ) {
                // we find that 'value' should be in this column
                candidate_lines.push({
                    value:   value,
                    column:  test_col
                });
            }
            if (test_row !== -1 ) {
                // we find that 'value' should be in this column
                candidate_lines.push({
                    value:   value,
                    row:  test_row
                });
            }            
        }
    });
    
    return candidate_lines;
};

/**
 * returns the cells in this Metacell that can be set to value
 * 
 */
MetaCell.prototype.find_possible_cells = function(value) {
    
    value = "" + value;
    
    var res = [];
    var i, j;
    for (i = 0; i < this.nbRow; i++) {
        for (j = 0; j < this.nbCol; j++) {
            var c = this.cell(i, j);
            //xx console.log(c.possibleValues);
            if (c.possibleValues.lastIndexOf(value) !== -1) {
                res.push(c);
            }
        }
    }
    return res;
};

MetaCell.prototype.toString = function() {
    var i, j, c;
    var strR ="";
    for (i = 0; i < this.nbRow; i++) {
        var str = "";
        for (j = 0; j < this.nbCol; j++) {
            c = this.cell(i, j);
            if (c.isKnown()) str = str + c.value();
            else str = str + ".";
        }
        strR += str + "|";
    }
    return strR;
};

MetaCell.prototype.print = function() {
    console.log(this.toString());
};


MetaCell.prototype.performDeductions = function() {
    // hidden single technique
    // 
    var zone = this;
    var b = zone.get_unknown_values();

    b.every(function(value) {
        var res = zone.find_possible_cells(value);
        if (res.length === 0 ) {
            zone.parent.setUnsolvable(" cannot find candidate cells for " + value + " in meta cell" + zone.row + "[" + zone.nbRow + "]," + zone.col + "[" + zone.nbCol + "]");
            return false; // cannot solve - dead end
        }
        assert(res.length != 0, " cannot find candidate cells for " + value + " in meta cell" + zone.row + "[" + zone.nbRow + "]," + zone.col + "[" + zone.nbCol + "]");
        if (res.length === 1) {
            var c = res[0];
            console.log(" Only Choice !", value, c.row, ",", c.col, c.possibleValues);
            c.setKnown(value);
        }
        return true;
    });
    return true;
};
function same_array(a,b) {
    assert( a instanceof Array && b instanceof Array);
    return a.toString() === b.toString();
}

MetaCell.prototype.apply_naked_pair = function(pair_of_values) {
    var self = this;
    assert(pair_of_values  instanceof Array);
    assert(pair_of_values.length === 2);
    assert(pair_of_values[0] < pair_of_values[1]);
    assert(typeof pair_of_values[0] === 'string');
    assert(typeof pair_of_values[1] === 'string');    
    var cells = this.get_cells();
    
    var total_excluded = 0 ,nb_excluded;
    cells.forEach(function(cell){
       
       if (same_array(cell.possibleValues,pair_of_values)) {
           // this is the pair
       } else {
           
           // exclude the value of the pair in this cells
           nb_excluded = cell.excludeValues(pair_of_values);
           assert(nb_excluded>=0);
           total_excluded+=nb_excluded;
           

       }
    });
    
    if (total_excluded > 0) {
       self.parent.add_info("applying  naked pair " + pair_of_values.toString() + " on " + self.name);  
    }    
    return total_excluded;
};


MetaCell.prototype.apply_candidate_line = function(candidate_line) {
    
    assert(this.isSquare === true);
    
    assert(typeof candidate_line.value === 'string');
    assert(candidate_line.hasOwnProperty("row") || 
    candidate_line.hasOwnProperty("column"));
    var self = this;
    var line;
    if (candidate_line.hasOwnProperty("row")) {
        line = self.parent.get_line_metacell(candidate_line.row);
    } else {
        line = self.parent.get_col_metacell(candidate_line.column); 
    }


    // find cells of lines that are not in self
    var cells =  line.get_cells().filter(function(cell){
        return !self.has_cell(cell);  
    });
    
    var dim = self.parent.dim;
    assert(cells.length === dim * (dim -1));
    
    var modified_cells = 0; 
    cells.forEach(function(cell){
        
        var n1 = cell.possibleValues.length ;
        cell.excludeValue(candidate_line.value);
        var n2 = cell.possibleValues.length ;
        // console.log("Modifying " ,cell.RC,cell.possibleValues, n1,n2 ,candidate_line.value);
        modified_cells += (n1-n2);
        //
        if (n1-n2 > 0) {
            self.parent.add_info(" found 'candidate line' on " + self.name + " value = " + candidate_line.value + " r=" + candidate_line.row + " c=" + candidate_line.column  ); 
        }
       
    });
    
    return modified_cells;
    
};

MetaCell.prototype.getRows = function() {
    if (this.rows) {
        return this.rows;
    }

    var me = this;

    function __getRow(rowIndex) {
        var row = [];
        for (var colIndex = 0; colIndex < me.nbRow; colIndex++) {
            row.push(me.cell(rowIndex, colIndex));
        }
        return row;
    }
    var rows = [];
    for (var rowIndex = 0; rowIndex < this.nbRow; rowIndex++) {
        rows.push(__getRow(rowIndex));
    }
    this.rows = rows;
    return rows;
};

/**
 *  @property isSquare : true if metacell is a box 
 */
MetaCell.prototype.__defineGetter__("isSquare",function(){
    return this.nbRow === this.nbCol;
})
/**
 * @method has_cell
 * @return true if the provided cell belong to this metacell.
 */
MetaCell.prototype.has_cell = function(cell) {
    
    var cells = this.get_cells();
    
    
    var found = cells.filter(function(c) {
        return c.row == cell.row && c.col == cell.col;
    });
    return found.length === 1;
}


function Cell(row, col, sudoku) {
    this.row = row;
    this.col = col;
    this.possibleValues = sudoku.symbols.slice(0);
    this.parent = sudoku;
}
/**
 * @method has_possible_value
 * @return true if value is known as a possible candidate for the cell.
 */
Cell.prototype.has_possible_value = function(val) {
    val = ""+val;
  assert( typeof val === 'string'," must be a symbol");
  return  this.possibleValues.lastIndexOf(val) >=0; 
};
/**
 * @method isKnown
 * @return true if the value of the cell is known
 */
Cell.prototype.isKnown = function() {
    return (this.possibleValues.length === 1);
};

/**
 * returns a array of meta cell that contains this cell
 */
Cell.prototype.get_metacells = function() {
   var m = [];
   
   var dim = this.parent.dim;
   
   var r = Math.floor(this.row / dim);
   var c = Math.floor(this.col / dim);
   m.push( this.parent.get_square_metacell(r,c));
   m.push( this.parent.get_line_metacell(this.row));
   m.push( this.parent.get_col_metacell(this.col));
   return m;
};

Cell.prototype.conflicting_cells = function() {
  var meta_cells = this.get_metacells();
  if (this.possibleValues.length > 1) {
      return [];
  }
  
  var value = this.possibleValues[0];
  
  var self = this;
  function find_other_cells_in_zone(zone) {
      var arr = zone.get_cells().filter(function(cell){
         return cell.isKnown() && cell!=self && cell.has_possible_value(value);
      });
      return arr;
  }
  var a1 = find_other_cells_in_zone(meta_cells[0]);
  var a2 = find_other_cells_in_zone(meta_cells[1]);
  var a3 = find_other_cells_in_zone(meta_cells[2]);
  
  var conflicting_cells = a1.concat(a2,a3);
  
  var unique = conflicting_cells.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
  
  return unique;
};
/*
 * returns true if the cell contains a value that create a contradiction
 */
Cell.prototype.has_contradiction = function() {
    return this.conflicting_cells().length > 0;
};
/**
 * @method value
 * @return the value of the cell ( the cell must be known)
 */
Cell.prototype.value = function() {
    assert(this.possibleValues.length === 1, " cell has no value yet " + this.possibleValues);
    return this.possibleValues[0];
};

/**
 * @method displayValue
 * @return the  value of the cell or "." if the cell value is unknown 
 */
Cell.prototype.displayValue = function() {
    var that = this;
    if (that.isKnown()) {
        return that.value();
    }
    return ".";
};


Cell.prototype.__defineGetter__("RC",function() {
    return String.fromCharCode(65+this.row) + "" + (this.col +1);
});

Cell.prototype.setKnown = function(value) {

    value = "" + value ;
    if (this.possibleValues.length !== 1) {
        assert(this.possibleValues.lastIndexOf(value) != -1, " cell cannot have value of " + value + " " + this.possibleValues);
        this.parent.nb_known_cells++;
        this.possibleValues = ["" +value];
    }
    else {
        assert(this.value() == value, " trying to force a different value old value=" + this.value() + " " + value);
    }
};

Cell.prototype.excludeValue = function(value) {
    var lbefore = this.possibleValues.length;
    this.possibleValues = this.possibleValues.filter(function(a) {
        return a !== value;
    });
    if (this.possibleValues.length === 0) {
        this.parent.setUnsolvable(" removing too many values " + value + " at cell " + this.row + "," + this.col);
        return 0;
    }
    if (this.possibleValues.length === 1 && lbefore == 2) {
        this.parent.nb_known_cells++;
        //xx console.log(" after excluding ", value, " setting cell ",this.row,",",this.col," = " , this.value());
    }
    if (this.possibleValues.length === 0) {
        console.log(" EXCESSIVE EXCLUDED ", lbefore, value);
    }
    
    return lbefore - this.possibleValues.length;
};

Cell.prototype.excludeValues = function(values) {
    assert( values instanceof Array);
    var that = this;
    var total_excluded = 0;
    if (this.parent.isUnsolvable()) return 0;
    values.forEach(function(v) {
        var n = that.excludeValue(v);
        total_excluded += n;
    });
    return total_excluded;
};

Cell.prototype._reset = function() {
    this.possibleValues = this.parent.symbols.slice(0);
    this.status = "";
};

Cell.prototype.reset = function() {
   this._reset(); 
   this.parent.reset_all_calculated_cells();
    
};


function Sudoku(dimension) {

    this.dim = dimension;
    this.dim2 = dimension * dimension;
    this.errorMessage = [];
    this.infos = [];
    
    this.nb_known_cells = 0;
    this.symbols = "123456789ABCDEF0".substr(0, this.dim2).split('').map(function(a) {
        return a;
    });
    //xx console.warn(this.symbols);
    this.cells = [];
    this.metaCells = [];
    var i, j = 0,
        cc;

    // construct cell matrix
    for (i = 0; i < this.dim2; i++) {
        for (j = 0; j < this.dim2; j++) {
            this.cells[i * this.dim2 + j] = new Cell(i, j, this);
        }
    }
    // squared meta cells
    for (i = 0; i < this.dim; i++) {
        for (j = 0; j < this.dim; j++) {
            cc = new MetaCell(i * this.dim, j * this.dim, this.dim, this.dim, this);
            cc.name = "B" + (i*3+j+1);
            this.metaCells.push(cc);
        }
    }
    // lines meta cells
    for (i = 0; i < this.dim2; i++) {
        cc = new MetaCell(i, 0, 1, this.dim2, this);
        cc.name = "L" + (i+1);
        this.metaCells.push(cc);
    }
    // col meta cells    
    for (i = 0; i < this.dim2; i++) {
        cc = new MetaCell(0, i, this.dim2, 1, this);
        cc.name = "C" + (i+1);
        this.metaCells.push(cc);
    }

}


Sudoku.prototype.add_info = function(str) {
    this.infos.push(str);
};

Sudoku.prototype.reset_all_calculated_cells = function() {
    this.cells.forEach(function(cell){
        if (cell.status !== "0") {
            cell._reset();
        }
    });
    this.errorMessage = [];
    this.infos = [];
    this.update();
};

/**
 * @method get_square_metacell
 * @return {MetaCell}
 */
Sudoku.prototype.get_square_metacell = function(row, col) {
    assert( row >=0 && row < this.dim);
    assert( col >=0 && col < this.dim);
    var offset = 0;
    return this.metaCells[offset + row * this.dim + col];
};
/**
 * @method get_line_metacell
 * @return {MetaCell}
 */
Sudoku.prototype.get_line_metacell = function(row) {
    assert( row >=0 && row < this.dim2);

    var offset = this.dim * this.dim;
    return this.metaCells[offset + row];
    
}
/**
 * @method get_col_metacell
 * @return {MetaCell}
 */
Sudoku.prototype.get_col_metacell = function(col) {
    assert( col >=0 && col < this.dim2);
    var offset = this.dim2 +  this.dim * this.dim;
    return this.metaCells[offset + col];
    
};
Sudoku.prototype.cell = function(i, j) {
    assert(i >= 0 && i < this.dim2);
    assert(j >= 0 && j < this.dim2);
    return this.cells[i * this.dim2 + j];
};

Sudoku.prototype.isSolved = function() {
    return this.nb_known_cells === this.dim2 * this.dim2;
};

Sudoku.prototype.isUnsolvable = function() {
    return this.errorMessage.length >0;
};

Sudoku.prototype.setUnsolvable = function(message) {
    this.errorMessage.push(message);
};

Sudoku.prototype.initRow = function(row, str) {
    var j = 0;
    var that = this;
    str.split('').forEach(function(a) {
        var c = that.cell(row, j);
        if (a != '.') {
            c.setKnown(a);
            c.status = "0";
        }
        j++;
    });
};

Sudoku.prototype.init = function(str) {
    var that = this;
    var row = 0;
    str.split('|').forEach(function(line) {
        that.initRow(row, line);
        row++;
    });
    var count = 0;
    while (this.update()) {
        count++;
    }
};

Sudoku.prototype.update = function() {
    var n = this.nb_known_cells;
    this.metaCells.forEach(function(m) {
        m.update();
    });
    return (this.nb_known_cells !== n); // true if some cells have been solved
};

function print_sudoku(sudoku) {
    var i, j;
    for (i = 0; i < sudoku.dim2; i++) {
        if (i % sudoku.dim === 0) {
            console.warn("+-----------------------------+");
        }
        var str = "";
        for (j = 0; j < sudoku.dim2; j++) {
            if (j % sudoku.dim === 0) {
                str += '|';
            }
            var c = sudoku.cell(i, j);
            if (c.isKnown()) {
                str = str + " " + c.value() + " ";
            }
            else {
                str = str + " . ";
            }
        }
        str += "|";
        console.warn(str);
    }
    console.warn("+-----------------------------+");
}



function print_2(sudoku) {
    var color = require("ansi-color");
    
    function cv(cell, value) {
        if (cell.isKnown()) {
            if (value != '5') {
                if ( cell.status === "0") {
                    return '  '; // the value was given initialy
                }
                return ' *';
            }
            else {
              if ( cell.status === "0") {
                  return "" + color.set(' ' + cell.value(), "blue+bold");
              } else {
                  return "" + color.set(' ' + cell.value(), "blue+bold"); 
              }
            }
        }

        if (cell.isKnown()) {
            return "" + color.set(' ' + value, "green+bold");
        }
        else {

             if (!cell.has_possible_value(value)) {
                 return ' .';
                
             } else {
                return color.set(' ' + value, "green");
             }
        }

    }


    console.warn("+-----------------------------------------------------------------+");
    var i, j;
    for (i = 0; i < sudoku.dim2; i++) {
        if (i % sudoku.dim === 0) {
            console.warn("+-----------------------------------------------------------------+");
        }
        var str1 = "";
        var str2 = "";
        var str3 = "";
        for (j = 0; j < sudoku.dim2; j++) {
            if (j % sudoku.dim === 0) {
                str1 += '|';
                str2 += '|';
                str3 += '|';
            }
            var c = sudoku.cell(i, j);

            str1 = str1 + cv(c, '1');
            str1 = str1 + cv(c, '2');
            str1 = str1 + cv(c, '3');
            str2 = str2 + cv(c, '4');
            str2 = str2 + cv(c, '5');
            str2 = str2 + cv(c, '6');
            str3 = str3 + cv(c, '7');
            str3 = str3 + cv(c, '8');
            str3 = str3 + cv(c, '9');

            str1 = str1 + '|';
            str2 = str2 + '|';
            str3 = str3 + '|';
        }
        str1 += "|";
        str2 += "|";
        str3 += "|";
        console.warn(str1);
        console.warn(str2);
        console.warn(str3);
        console.warn("+-----------------------------------------------------------------+");
    }
    console.warn("+-----------------------------------------------------------------+");
    console.warn("");
    console.warn("messages = ",sudoku.errorMessage);
}


Sudoku.prototype.toString = function(options) {
    var str = "";
    var i, j;
    for (i = 0; i < this.dim2; i++) {
        for (j = 0; j < this.dim2; j++) {
            var c = this.cell(i, j);
            if (c.isKnown()) {
                
                if (options === "0") {
                    if (c.status==="0") {
                      str += c.value();   
                    } else {
                       str += "."; 
                    }
                    
                } else {
                     str += c.value();
                }
               
            }
            else {
                str += ".";
            }
        }
        str += "|";
    }
    return str;

};
Sudoku.prototype.asString = Sudoku.prototype.toString ;

Sudoku.prototype.getDeepCopy = function() {
    var newS = new Sudoku(this.dim);
    newS.init(this.asString());
    return newS;
};

Sudoku.prototype.search_and_resolve_naked_pairs = function() {
   
   var that = this;
   
   var nb_naked_pair_found = 0;

   var nb_modified_cells = 0;
     
   that.metaCells.forEach(function(metacell){
      
     var naked_pairs = metacell.detect_naked_pairs(); 
     
     naked_pairs.forEach(function(naked_pair) {
        nb_naked_pair_found ++;
        //xx console.log(" Found naked pair ",naked_pair.values);
        nb_modified_cells += metacell.apply_naked_pair(naked_pair.values);
     });
     
   });
   console.log("nb_naked_pair_found ",nb_naked_pair_found , " nb_modified_cells =",nb_modified_cells);
   return nb_modified_cells;
};

Sudoku.prototype.search_and_resolve_canditate_lines = function() {
   var that = this;   
   // apply on square metacells only
   
   var nb_modified_cells = 0;
   
   that.metaCells.forEach(function(metacell){
       
       if (metacell.isSquare) {
            var candidate_lines = metacell.detect_candidate_lines();
            
            candidate_lines.forEach(function(candidate_line){
                nb_modified_cells += metacell.apply_candidate_line(candidate_line);
            });
       } 
    });
    
    return nb_modified_cells;
};


function solve_Sudoku(str) {
    var s = new Sudoku(3);
    s.init(str);
    var counter = 0;

    var stack = [];
    stack.push(s);
    while (stack.length) {
        s = stack.pop();
        while (s.update()) {
            
            s.search_and_resolve_canditate_lines();
            
            s.search_and_resolve_naked_pairs();
            
            counter++; /*print_sudoku(s); */
        }

        if (s.isSolved()) {
            print_2(s);
            console.log(" sorted in ", counter, " rounds");
            console.log(s.asString());
            return;
        }
        // if not fully solved
        // find cells with only 2 possibles values
        var cc = s.cells.filter(function(c) {
            return c.possibleValues.length === 2;
        });
        // if none => we don't know how to solve yet
        if (cc.length === 0) {
            cc = s.cells.filter(function(c) {
                return c.possibleValues.length == 3;
            });
        }
        // console.log(cc);
        // take one at random
        var cell = cc[0];

        // add two branches 
        cell.possibleValues.forEach(function(value) {
            var ss = s.getDeepCopy();
            ss.cell(cell.row, cell.col).setKnown(value);
            console.log(" pushing ", ss.asString());
            stack.push(ss);
        });
        console.log(" poping ", s.asString());
    }
}

function rand(maxValue) {
    var r = Math.round(Math.random() * maxValue);
    if (r <= 0) r = 0;
    if (r >= maxValue) r = maxValue - 1;
    return r;
}

function build_sudoku() {
    var dim = 3;
    var s = new Sudoku(dim);
    var sol = new Sudoku(dim);
    var count = 0;

    while (s.nb_known_cells !== s.dim2 * s.dim2) {
        while (s.update()) {
            console.log(" solving ");
        }
        console.log(" solved");

        // find a unkown cell at random
        var unknown_cells = s.cells.filter(function(c) {
            return !c.isKnown();
        });
        if (unknown_cells.length === 0) {
            console.log(" anormal break", s.nb_known_cells);
            break;
        }

        var i = rand(unknown_cells.length);

        var c = unknown_cells[i];
        console.log(" looking at ", i, unknown_cells.length, " ", c.row, c.col);
        if (!c) {
            console.log("i=", i, unknown_cells);
        }
        var ps = c.possibleValues;
        var j = rand(ps.length);
        var value = ps[j];
        c.setKnown(value);
        sol.cell(c.row, c.col).setKnown(value);
        count++;

    }
    print_2(sol);
    console.warn("avec ", count, " cellules");
}

exports.print_sudoku = print_sudoku;
exports.print_2 = print_2;
exports.Sudoku = Sudoku;

}(typeof exports === 'undefined' ? this.sudoku = {} : exports));


// solve_Sudoku("..9.15.7.|.3.72.1..|..48.35..|.7856.2..|1.......5|..3.4271.|..61.93..|..7.84.5.|.8.63.4..");

//solve_Sudoku(".42375.9.|..91..245|.5.4....7|23...4786|4.7.3..59|...8.7...|.1.653..2|.6.....3.|923781.64");

//solve_Sudoku("16..9....|..2...9..|4.....1.2|....89..7|6...324.8|..7.....1|...647.2.|.......4.|.3......9");

// very difficult  
//solve_Sudoku(".......27|....643.5|9....1...|..2...75.|..4.....8|6...95...|..958...2|.1.3.....|.8...6...");
//solve_Sudoku("..41.....|9....53..|.3...6..5|..8.9.4..|..53..6..|.2....8..|.5..6.1..|7....2.49|........2");
 
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

//solve_Sudoku("1..8.9...|..5.1....|43...71..|517...2..|...2.5...|..6...953|..37...16|....9.5..|...4.1..7");

