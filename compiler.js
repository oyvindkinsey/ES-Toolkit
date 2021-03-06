/*globals Tokenizer, AstGenerator */
function Compiler(ast){
    this.ast = ast;
    this.buffer = [];
    this.prevSymbol = {
        type: AstGenerator.prototype.TYPES.StatementTerminator
    };
}

Compiler.prototype = {
    processSymbol: function renderSymbol(symbol, next, parent){
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
                break;
            case T.SourceElement:
                push("{");
                break;
            case T.ObjectLiteral:
                push("{");
                separationChar = ",";
                break;
            case T.PropertyName:
                if (symbol.data == Tokenizer.prototype.TYPES.Identifier) { // !(Tokenizer.prototype.KEYWORDS.hasOwnProperty(symbol.value)) && symbol.value != "this" && /^[\w$]+$/.test(symbol.value)) {
                    push(symbol.value);
                }
                else {
                    push("\"" + symbol.value + "\"");
                }
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
                    push(" do ");
                }
                break;
            case T.Identifier:
                push(" " + symbol.value + " ");
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
                break;
            case T.FalsePart:
                push(" else ");
                break;
            case T.TernaryFalsePart:
                push(":");
                break;
            case T.Arguments:
                push("(");
                separationChar = ",";
                break;
            case T.Arguments:
                separationChar = ",";
                break;
            case T.StatementTerminator:
                push(";");
                break;
            case T.FunctionDeclaration:
            case T.FunctionExpression:
                push(" function " + (symbol.value || ""));
                break;
            case T.IfStatement:
                push(" if ");
                break;
            case T.Keyword:
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
                push(" " + symbol.value + " ");
                break;
            case T.SwitchStatement:
                push(" switch ");
                break;
            case T.SwitchExpression:
                push("(");
                break;
            case T.CaseStatement:
                push(" case ");
                break;
            case T.DefaultStatement:
                push(" default:");
                break;
            case T.MemberExpression:
                separationChar = "[";
                break;
            case T.DotExpression:
                separationChar = ".";
                break;
            case T.AssignmentExpression:
                separationChar = symbol.value;
                break;
            case T.BooleanLiteral:
                push(symbol.value);
                break;
            case T.WhileExpression:
                push(" while(");
                break;
            case T.ForExpression:
                push(" for(");
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
            case T.BooleanExpression:
                if (parent.type == T.IfStatement) {
                    push("(");
                }
                break;
            case T.TernaryTruePart:
                push("?");
                break;
            case T.FalsePart:
                push(" else ");
                break;
            case T.ReturnStatement:
                push(" return ");
                break;
            case T.BreakStatement:
                push(" break ");
                break;
            case T.InExpression:
                separationChar = " in ";
                break;
            case T.ThrowStatement:
                push(" throw ");
                break;
            case T.BitwiseExpression:
                separationChar = symbol.value;
                break;
            case T.NullLiteral:
                push("null");
                break;
            case T.TryStatement:
                push(" try");
                break;
            case T.Catch:
                push(" catch ");
                break;
            case T.ExceptionIdentifier:
                push("(");
                break;
            case T.Finally:
                push(" finally ");
                break;
            case T.NewStatement:
                push(" new ");
                break;
            case T.InstanceOfExpression:
                separationChar = " instanceof ";
                break;
            case T.ExpressionStatement:
                separationChar = ",";
                break;
            default:
            // push(symbol.value);
        
        }
        
        
        if (symbol.stream) {
            for (var i = 0, len = symbol.stream.length; i < len; i++) {
                var l = symbol.stream[i - 1] || {}, s = symbol.stream[i], n = symbol.stream[i + 1] || {};
                this.processSymbol(s, n, symbol);
                if (separationChar && i < len - 1) {
                    if (symbol.type == T.InstanceOfExpression && s.type == T.Identifier) {
                        push(" ");
                    }
                    push(separationChar);
                    if (symbol.type == T.InstanceOfExpression && n.type == T.Identifier) {
                        push(" ");
                    }
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
                
            case T.BooleanExpression:
                if (parent.type == T.IfStatement) {
                    push(")");
                }
                break;
            case T.WhileExpression:
                // do/while requires to be terminated by ;
                push(")");
                break;
            case T.PostfixExpression:
                push(symbol.value);
                break;
            case T.CaseClause:
                push(":");
                break;
            case T.MemberExpression:
                push("]");
                break;
            case T.ArrayLiteral:
                push("]");
                break;
            case T.ExceptionIdentifier:
                push(")");
                break;
        }
        this.prevSymbol = symbol;
    },
    compress: function(stream){
        var buffer = [], i = 0, len = stream.length;
        var left, right;
        if (stream.length < 3) {
            //we need at least three tokens to compress
            return stream;
        }
        right = stream[0];
        if (right.charAt(0) == " ") {
            right = right.substring(1);
        }
        for (; i < len; i++) {
            left = right;
            right = stream[i + 1] || "";
            // trim adjacent whitespace and whitespace/punctuator combinations
            var l = left.charAt(left.length - 1), r = right.charAt(0);
            if (l == " " && (r == " " || Tokenizer.prototype.PUNCTUATORS.hasOwnProperty(r))) {
                left = left.substring(0, left.length - 1);
                l = left.charAt(left.length - 1)
            }
            if (r == " " && Tokenizer.prototype.PUNCTUATORS.hasOwnProperty(l)) {
                right = right.substring(1);
            }
            buffer.push(left);
        }
        buffer.push(right);
        return buffer;
    },
    compile: function(){
        this.processSymbol(this.ast, {}, {});
        
        
        
        return this.compress(this.buffer.slice(1, -1)).join("");
    }
};
