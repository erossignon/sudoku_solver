/* global: angular, sudoku*/
// var sudoku = require("sudoku");
var app = angular.module('sudoku', ['ngTouch','angular-gestures'/* , 'ui','ui.bootstrap'*/]);

app.directive("sudokuBox", function () {
    return {
        restrict: "E",
        replace: false,
        templateUrl: "/sudoku-box.html",
        link: function ($scope, element) {
            
            $scope.sudoku.extra = $scope.sudoku.extra  || {};
            var sudoku_extra = $scope.sudoku.extra;
             
            $scope.is_selector_shown = function() {
                
                return sudoku_extra.metacell && (sudoku_extra.metacell.name === $scope.metacell.name);
             };
            
        }
    };
});

app.directive("sudokuSelector", function () {

    return {
        restrict: "E",
        replace: false,
        templateUrl: "/sudoku-selector.html",
        link: function($scope,element) {

            $scope.sudoku.extra = $scope.sudoku.extra  || {};
            var sudoku_extra = $scope.sudoku.extra;

            $scope.$watch("cell_touched", function(newVal,oldVal){
                console.log(" ");
            });
            
            $scope.is_num_selector_visible = function(num) {
                return sudoku_extra.cell_touched && sudoku_extra.cell_touched.has_possible_value(num);
            };
            

            $scope.selectNumber = function(number) {
                
                var cell =  sudoku_extra.cell_touched;
               
                if (number <=0) {
                    cell.reset();
                } else {
                    cell.setKnown(number);
                    cell.status="0";            
                }
                $scope.iterate();
                $scope.desactivate_cell();
             };            
        }
    };        
    
});

app.directive("sudokuCell", function () {
    return {
        restrict: "E",
        replace: false,
        templateUrl: "/sudoku-cell.html",
        
        link: function ($scope, element , attr) {
        
            $scope.sudoku.extra = $scope.sudoku.extra  || {};
            var sudoku_extra = $scope.sudoku.extra;
            
            sudoku_extra.cell_touched = null;
              
            $scope.handleSwipe = function(event) {
                // erase
                var cell =  $scope.cell;
                if (!cell) { return; }
                cell.reset();   
                $scope.desactivate_cell();
                
            }
             $scope.touch_activate_cell = function(cell) {
                 
                  
                  if ( sudoku_extra.selector_visible) {
                      $scope.desactivate_cell();
                      return; // ignore
                  }
                  $scope.touchcell = cell;
                  sudoku_extra.cell_touched =  cell;
                  sudoku_extra.metacell = $scope.metacell;
                  sudoku_extra.cellposStyle = { top: '0px' , left: '0px' };
                  console.log(" $scope.cell_touched  = ",sudoku_extra.cell_touched );
                
                  sudoku_extra.selector_visible = this;
                  return false; // ??   $event.stopPropagation();
             };
            $scope.cellColor = function(c) {
                if (c.status == "0") { return "userDefined";}
                return "";
            };
            $scope.activate_cell = function(cell) {
                  if ( sudoku_extra.selector_visible) {
                     return; // ignore
                  }
                  cell.is_activated = true;
            };
            

            
            $scope.selectAction = function() {
                
                if (this.cellChoice === "RESET") {
                    this.cell.reset();
                } else {
                    this.cell.setKnown(this.cellChoice);
                    this.cell.status="0";            
                }
        
                $scope.iterate();
                this.cell.is_activated = false;
                // alert("h" + this.cell + "  " + this.$index);
            };
            
        }
    };
});


function initialize_localstorage() {
    
    var localStorage = window.localStorage;
    
    var persistedGrids = 0;
    if (localStorage) {
       try {
           persistedGrids = JSON.parse(localStorage.persistedGrids);
       } catch(err) {
           persistedGrids = 0;
       }
    }
    if (typeof persistedGrids !== typeof {} ) {
         persistedGrids = {
     
            "Mat- n 67": 
                        "........1|4.2...79.|6...2....|"+
                        "7..1....9|.8.29.154|.4.3.....|"+
                        "5.4...8..|...7...13|....1....",
                        
            "Candidate Lines 2":
                        "........1|4.2...79.|6...2....|"+
                        "7..1....9|.8.29.154|.4.3.....|"+
                        "5.4...8..|...7...13|....1....",
                        
            "Candidate Lines":
                        "..1957.63|...8.6.7.|769.3.8.5|..726.35.|31.49....|.56.7....|1.8..95.7|.9....6.8|6.45.3...",
                        
            "naked pairs":
                        "4..27.6..|798156234|.2.84...7|237468951|849531726|561792843|.82.15479|.7..243..|..4.87..2"
            
        };        
    }

    if (localStorage) {    
        localStorage.persistedGrids |= JSON.stringify(persistedGrids);
    }  
   
    return persistedGrids; 

}

app.controller('boardCtrl', [ '$scope', function($scope) {
   
   $scope.selector_visible = null;
   
   $scope.storage =  initialize_localstorage();
  
    $scope.getMetaRows = function () {
        
        if (this.metaRows) { return this.metaRows;}
        var me = this;
        function  __getMetaRow(rowIndex) {
            var row = [] ;
            for (var colIndex=0;colIndex<me.sudoku.dim;colIndex++) {
                row.push( me.sudoku.get_square_metacell(rowIndex,colIndex) );
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
    

    $scope.search_and_resolve_naked_pairs = function() {
       this.sudoku.search_and_resolve_naked_pairs(); 
    };
    
    $scope.search_and_resolve_canditate_lines = function() {
       this.sudoku.search_and_resolve_canditate_lines(); 
    };    
    
    $scope.iterate = function() {
        this.sudoku.update();
        this.reset_activation();
        
        $scope.selector_visible = null;
    };
    
    $scope.reset = function() {
        this.sudoku = new sudoku.Sudoku(3);
        // reset cache
        this.metaRows = null;
        $scope.sudoku = new sudoku.Sudoku(3);    
        $scope.sudoku.extra  =  $scope.sudoku.extra || {};   
        var  sudoku_extra =  $scope.sudoku.extra;  
     };

    $scope.reset_activation = function() {
        this.sudoku.cells.forEach(function(cell){
          cell.is_activated = false;  
        });
    };
    

    $scope.initialize_grid = function(str) {
        this.reset();
        if (str) {
            this.sudoku.init(str);
        }
    };
    
    $scope.problems =
      Object.keys($scope.storage).map(function(k){
          return {name: k , value: $scope.storage[k]
              
          }});
    
    
    $scope.selected_problem =  $scope.problems[0];
    
    $scope.load_selected_problem = function() {
      
       $scope.initialize_grid( $scope.selected_problem.value);
    };
    
    
    $scope.load_selected_problem();
     
   // $scope.sudoku.init(
   //".......27|....643.5|9....1...|..2...75.|..4.....8|6...95...|..958...2|.1.3.....|.8...6...");
   //"1..8.9...|..5.1....|43...71..|517...2..|...2.5...|..6...953|..37...16|....9.5..|...4.1..7");

    $scope.desactivate_cell = function(cell) {
        $scope.sudoku.extra  =  $scope.sudoku.extra || {};   
        var  sudoku_extra =  $scope.sudoku.extra;  
        
        if (sudoku_extra.cell_touched) {
            sudoku_extra.cell_touched.is_activated = false;  
            sudoku_extra.cell_touched = null;
        }
        setTimeout(function() {
            $scope.$apply(function() {
                sudoku_extra.selector_visible = null;
                sudoku_extra.metacell = null;
            });
        },20);
    
    };
    
}]);

