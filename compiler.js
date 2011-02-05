function Compiler(ast){
    this.ast = ast;
    this.buffer = [];
    this.prevSymbol = {};
}

Compiler.prototype = {
    processSymbol: function renderSymbol(symbol, parent){
        var T = AstGenerator.prototype.TYPES;
        var b = this.buffer, push = function(s){
            b.push(s);
        };
        var top;
        var separationChar = "";
        // begin symbol
        switch (symbol.type) {
        
            case T.Block:
                push("{");
                separationChar = ";";
                break;
            case T.SourceElement:
            case T.ObjectLiteral:
                push("{");
                separationChar = ","
                break;
            case T.StringLiteral:
                push("\"" + symbol.value + "\"");
                break;
            case T.FormalParameterList:
            case T.GroupingExpression:
                push("(");
                separationChar = ",";
                break;
            case T.PropertyAssignment:
                separationChar = ":";
                break;
            case T.IterationStatement:
                if (symbol.value == "do") {
                    push("do");
                }
                break;
            case T.Identifier:
                push((this.prevSymbol.type == T.Keyword && parent.type != T.MemberExpression ? " " : "") + symbol.value);
                break;
            case T.VariableDeclaration:
                push(symbol.value);
                break;
            case T.NumericLiteral:
                push(symbol.value);
                break;
            case T.MultiplicativeExpression:
            case T.AdditiveExpression:
            case T.RelationalExpression:
            case T.MultiplicativeExpression:
                separationChar = symbol.value;
                break;
            case T.IfExpression:
                push("(");
                separationChar = ";";
                break;
            case T.ElseStatement:
                push("else");
                break;
            case T.Arguments:
                push("(");
                break;
            case T.Arguments:
                separationChar = ",";
                break;
            case T.StatementTerminator:
                push(";");
                break;
            case T.FunctionDeclaration:
            case T.FunctionExpression:
                push("function" + (symbol.value ? " " + symbol.value : ""));
                break;
            case T.IfStatement:
                push("if");
                break;
            case T.Keyword:
                if (this.prevSymbol.type == T.Identifier || (this.prevSymbol.type == T.Keyword && parent.type != T.MemberExpression)) {
                    push(" ");
                }
                push(symbol.value);
                break;
            case T.VariableStatement:
                push("var ");
                separationChar = ",";
                break;
            case T.Initializer:
                push("=");
                break;
            case T.UnaryExpression:
                //make sure we don't emit ++ or -- when we have an UnaryEpression in an AdditiveExpression with the same operator 
                push((b[b.length - 1] == symbol.value ? " " : "") + symbol.value);
                break;
            case T.SwitchStatement:
                push("switch");
                break;
            case T.SwitchExpression:
                push("(");
                break;
            case T.CaseStatement:
                push("case ");
                break;
            case T.DefaultStatement:
                push("default:");
                break;
            case T.MemberExpression:
                if (this.prevSymbol.type == T.Keyword) {
                    push(" ");
                }
                separationChar = symbol.stream[1].type == T.Identifier ? "." : "[";
                break;
            case T.AssignmentExpression:
                separationChar = "=";
                break;
            case T.BooleanLiteral:
                push(symbol.value);
                break;
            case T.WhileExpression:
                push("while(");
                break;
            case T.ForExpression:
                push("for(");
                separationChar = ";";
                break;
            case T.ShiftExpression:
            case T.LogicalExpression:
            case T.EqualityExpression:
                separationChar = symbol.value;
                break;
            case T.RegularExpressionLiteral:
                push(symbol.value);
                break;
            case T.ArrayLiteral:
                push("[");
                separationChar = ",";
                break;
            default:
            // push(symbol.value);
        
        }
        
        
        if (symbol.stream) {
            for (var i = 0, len = symbol.stream.length; i < len; i++) {
                this.processSymbol(symbol.stream[i], symbol);
                if (separationChar && i < len - 1) {
                    push(separationChar);
                }
            }
        }
        
        //end symbol
        switch (symbol.type) {
            case T.ObjectLiteral:
            case T.SourceElement:
            case T.Block:
                push("}");
                break;
            case T.Arguments:
            case T.GroupingExpression:
            case T.FormalParameterList:
            case T.IfExpression:
            case T.ForExpression:
            case T.SwitchExpression:
                push(")");
                break;
                
            case T.WhileExpression:
                // do/while requires to be terminated by ;
                push(")" + (parent.value == "do" ? ";" : ""));
                break;
            case T.PostfixExpression:
                push(symbol.value);
                break;
            case T.CaseClause:
                push(":");
                break;
            case T.MemberExpression:
                if (separationChar == "[") {
                    push("]");
                }
                break;
            case T.ArrayLiteral:
                push("]");
                break;
        }
        this.prevSymbol = symbol;
    },
    compile: function(){
        // we don't need to process the top SourceElement
        this.ast.type = "";
        this.processSymbol(this.ast, null);
        
        
        
        return this.buffer.join("");
    }
};
