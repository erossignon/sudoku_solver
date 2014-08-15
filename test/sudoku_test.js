/* global: it, describe, before, after, xit */
var Sudoku = require("../public/sudoku");
var should = require("should");

describe("sudoku basics",function() {

    var sudoku;
    before(function(){
        sudoku = new Sudoku.Sudoku(3);
        
        // fake grid , with invalid data
        sudoku.init(
             "123456789|" +
             "234567891|" +
             "345678912|" +
             "987654321|" +
             "876543219|" +
             "765432198|" +
             "654321987|" +
             "543219876|" +
             "432198765" 
        );
    });
    
    it("should create an empty board",function() {
        
        var board = new Sudoku.Sudoku(3);
        board.nb_known_cells.should.equal(0);
        
        board.get_square_metacell(0,0).get_unknown_values().should.have.lengthOf(9);
        
        //console.log(board.get_square_metacell(0,0).find_possible_cells(1));
        
        board.get_square_metacell(0,0).find_possible_cells("1").should.have.lengthOf(9);
        
    });
    
    
    it("should have 3*3*3  metacells" ,function(){
        sudoku.metaCells.length.should.equal(27);
    });
      
    it("should access square metacells" ,function(){
        sudoku.get_square_metacell(0,0).toString().should.eql("123|234|345|");
        sudoku.get_square_metacell(0,1).toString().should.eql("456|567|678|");
        sudoku.get_square_metacell(1,0).toString().should.eql("987|876|765|");
    });
    it("should raise an exception when a invalid square metacells is accessed" ,function(){
        (function(){sudoku.get_square_metacell(-1,0);}).should.throwError();
        (function(){sudoku.get_square_metacell(1,3);}).should.throwError();
        (function(){sudoku.get_square_metacell(3,1);}).should.throwError();
    });    
    it("should access line metacells" ,function(){
        sudoku.get_line_metacell(0).toString().should.eql("123456789|");
        sudoku.get_line_metacell(5).toString().should.eql("765432198|");
    });    
    it("should raise an exception when a invalid line metacells is accessed" ,function(){
        (function(){sudoku.get_line_metacell(-1);}).should.throwError();
        (function(){sudoku.get_line_metacell(10);}).should.throwError();
    }); 
    it("should access col metacells" ,function(){
        sudoku.get_col_metacell(0).toString().should.eql("1|2|3|9|8|7|6|5|4|");
        sudoku.get_col_metacell(5).toString().should.eql("6|7|8|4|3|2|1|9|8|");
    });    
    it("should raise an exception when a invalid col metacells is accessed" ,function(){
        (function(){sudoku.get_col_metacell(-1);}).should.throwError();
        (function(){sudoku.get_col_metacell(10);}).should.throwError();
    });  
    
    it("should have cell(0,0) belonging to first columns metacell",function(){
    
        var metacell = sudoku.get_col_metacell(0);
        metacell.has_cell(sudoku.cell(0,0)).should.equal(true);
        metacell.has_cell(sudoku.cell(1,0)).should.equal(true);
        metacell.has_cell(sudoku.cell(0,1)).should.equal(false);        
    });
    
});

describe("sudoku metacells has cell",function() {

    
});

describe("sudoku",function() {
    
    
    it("should propagate possible values when a cell is set",function(){
        var board = new Sudoku.Sudoku(2);
        board.nb_known_cells.should.equal(0);
        
        board.cell(0,0).possibleValues.should.have.lengthOf(4);
        board.cell(1,0).possibleValues.should.have.lengthOf(4);
        board.cell(0,1).possibleValues.should.have.lengthOf(4);
        
        board.cell(0,0).setKnown(1);
        var count=0;
        while(board.update()){ count++; }
        
        board.cell(0,0).possibleValues.should.have.lengthOf(1);
        board.cell(1,0).possibleValues.should.have.lengthOf(3);
        board.cell(0,1).possibleValues.should.have.lengthOf(3);
        
        (function() { board.cell(1,0).setKnown(1); }).should.throwError();
        
        
    });
    
    it("should detect naked pairs ",function() {
        // https://www.sudokuoftheday.com/techniques/naked-pairs-triples/
        
        var str = "4..27.6..|798156234|.2.84...7|" + 
                  "237468951|849531726|561792843|" + 
                  ".82.15479|.7..243..|..4.87..2"
        var s = new Sudoku.Sudoku(3);
        s.init(str);  
        s.update();

        s.get_square_metacell(0,0).get_known_values().should.eql(["4","7","9","8","2"]);
      
        s.get_square_metacell(0,0).updateUnknownCells().should.eql(true);  
        s.cell(0,1).possibleValues.should.eql(["1","5"]);
        
        Sudoku.print_2(s);
        
        // line  9
        // +-----------------------------------------------------------------+
        // | 1 . 3| 1 . .|      || . . 3|      |      || 1 . .| 1 . .|      ||
        // | . . 6| . 5 .|   4  || . . 6|   8  |   7  || . 5 .| . . 6|   2  ||
        // | . . 9| . . .|      || . . 9|      |      || . . .| . . .|      ||
        // +-----------------------------------------------------------------+
        s.cell(8,0).possibleValues.should.eql(["1","3","6","9"]);
        s.cell(8,1).possibleValues.should.eql(["1","5"]);
        s.cell(8,2).possibleValues.should.eql(["4"]);
        s.cell(8,3).possibleValues.should.eql(["3","6","9"]);
        s.cell(8,4).possibleValues.should.eql(["8"]);
        s.cell(8,5).possibleValues.should.eql(["7"]);
        s.cell(8,6).possibleValues.should.eql(["1","5"]);
        s.cell(8,7).possibleValues.should.eql(["1","6"]);
        s.cell(8,8).possibleValues.should.eql(["2"]);
        
        
        var last_line = s.get_line_metacell(8);
        var naked_pairs = last_line.detect_naked_pairs();
        
        naked_pairs.length.should.eql(1);
        naked_pairs[0].values.should.eql(["1","5"]);
        naked_pairs[0].cells[0].possibleValues.should.eql(["1","5"]);
        naked_pairs[0].cells[1].possibleValues.should.eql(["1","5"]);
        
        naked_pairs[0].cells[0].RC.should.eql("I2");
        naked_pairs[0].cells[1].RC.should.eql("I7");
        
        last_line.apply_naked_pair(["1","5"]);
        
        // now line 9 shall be :
        Sudoku.print_2(s);
        // +-----------------------------------------------------------------+
        // | X . 3| 1 . .|      || . . 3|      |      || 1 . .| X . .|      ||
        // | . . 6| . 5 .|   4  || . . 6|   8  |   7  || . 5 .| . . 6|   2  ||
        // | . . 9| . . .|      || . . 9|      |      || . . .| . . .|      ||
        // +-----------------------------------------------------------------+
        s.cell(8,0).possibleValues.should.eql(["3","6","9"]);
        s.cell(8,1).possibleValues.should.eql(["1","5"]);
        s.cell(8,2).possibleValues.should.eql(["4"]);
        s.cell(8,3).possibleValues.should.eql(["3","6","9"]);
        s.cell(8,4).possibleValues.should.eql(["8"]);
        s.cell(8,5).possibleValues.should.eql(["7"]);
        s.cell(8,6).possibleValues.should.eql(["1","5"]);
        s.cell(8,7).possibleValues.should.eql(["6"]);
        s.cell(8,8).possibleValues.should.eql(["2"]);    
        
        s.search_and_resolve_naked_pairs().should.eql(0); // laredy fixed
    });
    
    it("should search_and_resolve_naked_pairs ",function() {
        // https://www.sudokuoftheday.com/techniques/naked-pairs-triples/
        
        var str = "4..27.6..|798156234|.2.84...7|" + 
                  "237468951|849531726|561792843|" + 
                  ".82.15479|.7..243..|..4.87..2"
        var s = new Sudoku.Sudoku(3);
        s.init(str);  
        s.update();  
        
         s.search_and_resolve_naked_pairs().should.eql(2);
    });
    
    xit("should detect naked triples ",function() {
    

        
        var str = "6..8.2735|7.235694.|3..4.7.62|" + 
                  "1..975.24|2..183.79|.79624..3|" + 
                  "4..56.2.7|.6724.3..|92.7384.6"
        var s = new Sudoku.Sudoku(3);
        s.init(str);  
        s.update();
    
        Sudoku.print_2(s);      
        // look at column 1
        var column1 = s.get_col_metacell(1);
        var naked_pairs = column1.detect_naked_pairs();    
         
        naked_pairs.length.should.equal(0);
         
        var naked_triples = column1.detect_naked_triples();
        
    });
    
    it("should solve Candidate Lines", function() {
      
      var str = "..1957.63|...8.6.7.|76913.8.5|..726135.|312495786|.56378...|1.86.95.7|.9.71.6.8|674583...|";
      var s = new Sudoku.Sudoku(3);
      s.init(str);  
      s.update();        
      Sudoku.print_2(s);       
      
      var metacell = s.get_square_metacell(2,2);
      metacell.cell(0,0).possibleValues.should.eql(["5"]);
      metacell.cell(0,1).possibleValues.should.eql(["2","3","4"]);
      metacell.cell(0,2).possibleValues.should.eql(["7"]);
      metacell.cell(1,0).possibleValues.should.eql(["6"]);
      metacell.cell(1,1).possibleValues.should.eql(["2","3","4"]);
      metacell.cell(1,2).possibleValues.should.eql(["8"]);
      metacell.cell(2,0).possibleValues.should.eql(["1","2","9"]);
      metacell.cell(2,1).possibleValues.should.eql(["1","2","9"]);
      metacell.cell(2,2).possibleValues.should.eql(["1","2","9"]); 
      
      var candidate_lines = metacell.detect_candidate_lines();
      
      console.log( "candidate_lines =",candidate_lines);
      candidate_lines.length.should.equal(4);
      
      candidate_lines[0].should.eql({ value: '1' , row: 8 });
      candidate_lines[1].should.eql({ value: '3' , column: 7 });      
      candidate_lines[2].should.eql({ value: '4' , column: 7 });      
      candidate_lines[3].should.eql({ value: '9' , row: 8 });  
      
      
      var col7 = s.get_col_metacell(7);
      col7.cell(2,0).possibleValues.should.eql(["2","4"]);
      col7.cell(5,0).possibleValues.should.eql(["1","2","4","9"]);
      
      var nb_modified_cells = metacell.apply_candidate_line(candidate_lines[2]);
      
      col7.cell(2,0).possibleValues.should.eql(["2"]);
      col7.cell(5,0).possibleValues.should.eql(["1","2","9"]);      
      
      nb_modified_cells.should.equal(2);
      
    });
    
    
    
});

// references:
// https://www.sudokuoftheday.com/techniques/naked-pairs-triples/
// http://www.paulspages.co.uk/sudokuxp/howtosolve/
// http://www.geometer.org/mathcircles/sudoku.pdf
// http://www.thonky.com/sudoku/simple-coloring/  +++
// http://www.sudokuwiki.org/sudoku.htm
// http://www.sudokuwiki.org/Intersection_Removal
// http://www.sudokuwiki.org/Alternating_Inference_Chains