// var sudoku = require("sudoku");
var app = angular.module('sudoku', [/*'ui','ui.bootstrap'*/]);

function boardCtrl($scope) {
    
   $scope.sudoku = new sudoku.Sudoku(3);
   
$scope.sudoku.init(
   //".......27|....643.5|9....1...|..2...75.|..4.....8|6...95...|..958...2|.1.3.....|.8...6...");
   "1..8.9...|..5.1....|43...71..|517...2..|...2.5...|..6...953|..37...16|....9.5..|...4.1..7");
  
    $scope.getMetaRows = function () {
        
        if (this.metaRows) { return this.metaRows;}
        var me = this;
        function  __getMetaRow(rowIndex) {
            var row = [] ;
            for (var colIndex=0;colIndex<me.sudoku.dim;colIndex++) {
                row.push( me.sudoku.metacell(rowIndex,colIndex) );
            }
            return row;
        }
   
        var rows = [] ;
        for (var rowIndex=0;rowIndex<this.sudoku.dim;rowIndex++) {
             rows.push( __getMetaRow(rowIndex) );
        }
        this.metaRows =  rows;
        return rows;
    };  
    $scope.selectAction = function() {
        this.cell.setKnown(this.cellChoice*1.0);
        this.cell.status="0";
        var count =0;
        while(this.cell.parent.Update()) { count++; }
        // alert("h" + this.cell + "  " + this.$index);
    };
    $scope.cellColor = function(c) {
        if (c.status == "0") { return "userDefined";}
        return "";
    }
}
