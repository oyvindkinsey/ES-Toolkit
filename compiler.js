function Compiler(ast){
    this.ast = ast;
    this.buffer = [];
}

Compiler.prototype = {
    processSymbol: function renderSymbol(symbol){
        var T = AstGenerator.prototype.TYPES;
        var b = this.buffer, push = function(s){
            b.push(s);
        };
        var separationChar = "";
        // begin symbol
        switch (symbol.type) {
            case T.SourceElement:
            case T.Block:
                push("{");
                break;
            case T.AdditiveExpression:
            case T.MultiplicativeExpression:
                break;
            case T.FormalParameterList:
            case T.GroupingExpression:
                push("(");
                separationChar = ",";
                break;
            case T.CallExpression:
                push(symbol.value + "(");
                break;
            case T.Arguments:
                separationChar = ",";
                break;
            case T.StatementTerminator:
                push(";");
                break;
            case T.FunctionDeclaration:
                push("function" + (symbol.value ? " " + symbol.value : ""));
                break;
            default:
                push(symbol.value);
                
        }
        
        
        if (symbol.stream) {
            for (var i = 0, len = symbol.stream.length; i < len; i++) {
                this.processSymbol(symbol.stream[i]);
                if (separationChar && i < len - 1) {
                    push(separationChar);
                }
            }
        }
        
        //end symbol
        switch (symbol.type) {
            case T.SourceElement:
            case T.Block:
                push("}");
                break;
            case T.CallExpression:
            case T.GroupingExpression:
            case T.FormalParameterList:
                push(")");
                break;
        }
    },
    compile: function(){
        this.processSymbol(this.ast);
        
        
        
        return this.buffer.join("");
    }
};
