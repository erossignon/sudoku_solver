var Sudoku = require("../public/sudoku");
var should = require("should");

describe("sudoku",function() {
    
    it("should create an empty board",function() {
        
        var board = new Sudoku.Sudoku(3);
        board.nb_known_cells.should.equal(0);
        
        board.metacell(0,0).get_unknown_values().should.have.lengthOf(9);
        
        //console.log(board.metacell(0,0).find_possible_cells(1));
        
        board.metacell(0,0).find_possible_cells(1).should.have.lengthOf(9);
        
    });
    it("should propagate possible values when a cell is set",function(){
        var board = new Sudoku.Sudoku(2);
        board.nb_known_cells.should.equal(0);
        
        board.cell(0,0).possibleValues.should.have.lengthOf(4);
        board.cell(1,0).possibleValues.should.have.lengthOf(4);
        board.cell(0,1).possibleValues.should.have.lengthOf(4);
        
        board.cell(0,0).setKnown(1);
        var count=0;
        while(board.Update()){ count++; }
        
        board.cell(0,0).possibleValues.should.have.lengthOf(1);
        board.cell(1,0).possibleValues.should.have.lengthOf(3);
        board.cell(0,1).possibleValues.should.have.lengthOf(3);
        
        (function() { board.cell(1,0).setKnown(1); }).should.throwError();
        
        
    });
});