//todo: [this.symbol], > MemberExpression

function AstGenerator(stream){
    this.stream = stream;
    this.pos = 0;
    this.length = stream.length;
    this.symbol = {
        type: this.TYPES.SourceElement
    };
    this.global = {
        type: this.TYPES.Program,
        stream: [this.symbol],
        vo: {}
    };
    this.stack = [this.global, this.symbol];
    this.head = this.symbol;
}

AstGenerator.prototype = {
    push: function(symbol){
        this.stack.push(symbol);
        this.head = symbol;
        return symbol;
    },
    pop: function(count){
        if (!count) {
            count = 1;
        }
        while (count--) {
            var symbol = this.stack.pop();
            this.head = this.stack[this.stack.length - 1];
        }
        return symbol;
    },
    add: function(symbol){
        if (!("stream" in this.head)) {
            this.head.stream = [];
        }
        this.head.stream.push(symbol);
        return symbol;
    },
    take: function(){
        if (!this.head.stream || this.head.stream.length == 0) {
            throw new Error("Cannot pop empty stream");
        }
        return this.head.stream.pop();
    },
    TYPES: {
        Program: "Program",
        FunctionExpression: "FunctionExpression",
        FunctionDeclaration: "FunctionDeclaration",
        Keyword: "Keyword",
        SourceElement: "SourceElement",
        CallExpression: "CallExpression",
        GroupingExpression: "GroupingExpression",
        AdditiveExpression: "AdditiveExpression",
        RelationalExpression: "RelationalExpression",
        MultiplicativeExpression: "MultiplicativeExpression",
        DotExpression: "DotExpression",
        MemberExpression: "MemberExpression",
        AssignmentExpression: "AssignmentExpression",
        FormalParameterList: "FormalParameterList",
        SwitchStatement: "SwitchStatement",
        TryStatement: "TryStatement",
        Catch: "Catch",
        Finally: "Finally",
        Arguments: "Arguments",
        SwitchExpression: "SwitchExpression",
        SwitchBlock: "SwitchBlock",
        CaseStatement: "CaseStatement",
        DefaultStatement: "DefaultStatement",
        ThrowStatement: "ThrowStatement",
        ReturnStatement: "ReturnStatement",
        CaseClause: "CaseClause",
        IterationStatement: "IterationStatement",
        WhileExpression: "WhileExpression",
        LogicalExpression: "LogicalExpression",
        TernaryExpression: "TernaryExpression",
        ForExpression: "ForExpression",
        ForInExpression: "ForInExpression",
        IterationBlock: "IterationBlock ",
        TruePart: "TruePart",
        FalsePart: "FalsePart",
        ForStatement: "ForStatement",
        IfStatement: "IfStatement",
        PostfixExpression: "PostfixExpression",
        BooleanExpression: "BooleanExpression",
        ExceptionIdentifier: "ExceptionIdentifier",
        ElseBlock: "ElseBlock",
        UnaryExpression: "UnaryExpression",
        EqualityExpression: "EqualityExpression",
        CaseBlock: "CaseBlock",
        Punctuator: "Punctuator",
        Parameter: "Parameter",
        Initializer: "Initializer",
        Identifier: "Identifier",
        PropertyAssignment: "PropertyAssignment",
        VariableStatement: "VariableStatement",
        VariableDeclaration: "VariableDeclaration",
        Block: "Block",
        BooleanLiteral: "BooleanLiteral",
        ArrayLiteral: "ArrayLiteral",
        ObjectLiteral: "ObjectLiteral",
        StringLiteral: "StringLiteral",
        NumericLiteral: "NumericLiteral",
        RegularExpressionLiteral: "RegularExpressionLiteral",
        ShiftExpression: "ShiftExpression"
    },
    log: function(msg){
        console.log("AST: " + msg);
    },
    readNext: function(){
        return this.stream[this.pos++];
    },
    peekNext: function(){
        return this.stream[this.pos] ||
        {
            type: Tokenizer.prototype.TYPES.LineTerminator
        };
    },
    read: function(){
        var TYPES = Tokenizer.prototype.TYPES;
        var token, previousToken = {
            type: TYPES.Semicolon
        }, head, symbol = this.symbol;
        
        var ast = this;
        var T = this.TYPES;
        
        function popWhile(){
            var args = Array.prototype.slice.call(arguments), l = args.length, types = {};
            while (l--) {
                types[args[l]] = 1;
            }
            while (ast.head.type in types) {
                ast.pop();
            }
        }
        
        function popToAndIncluding(){
            var args = Array.prototype.slice.call(arguments), l = args.length, types = {};
            while (l--) {
                types[args[l]] = 1;
            }
            while (true) {
                if (ast.pop().type in types) {
                    break;
                }
            }
        }
        
        function popWhileNot(){
            var args = Array.prototype.slice.call(arguments), l = args.length, types = {};
            while (l--) {
                types[args[l]] = 1;
            }
            while (!(ast.head.type in types)) {
                ast.pop();
            }
        }
        
        function popIfRequired(){
            while (ast.head.endOnPop) {
                ast.pop();
            }
        }
        
        //try {
        while (this.pos < this.length) {
            this.token = token = this.readNext();
            head = this.head;
            
            
            // todo: implement ASI
            if (token.type == TYPES.LineTerminator) {
                this.lineNumber++;
                this.linePos = this.pos;
                //ignore the LineTerminator unless we need to do ASI
                var asi = false;
                if (previousToken.type != TYPES.Semicolon) {
                    // after comments
                    if (previousToken.type == TYPES.CommentSingleLine || previousToken.type == TYPES.CommentMultiLine) {
                        //asi = true;
                    }
                    
                }
                if (asi) {
                    token = {
                        type: TYPES.Semicolon
                    };
                }
                else {
                    continue;
                }
            }
            
            //this is such a hack!
            if (head.type == T.TryStatement && token.data != "{" && token.data != "finally" && token.data != "catch") {
                this.pop();
                head = this.head;
            }
            switch (token.type) {
            
                case TYPES.Semicolon:
                    popWhileNot(T.SourceElement, T.Block, T.CaseBlock, T.ForExpression);
                    break;
                case TYPES.Keyword:
                    
                    switch (token.data) {
                        case "function":
                            symbol = this.push(this.add({
                                type: (previousToken.type == TYPES.Semicolon) ? T.FunctionDeclaration : T.FunctionExpression,
                                pos: token.pos
                            }));
                            // move through the identifier and the formal parameter list
                            token = this.readNext();
                            if (token.type == TYPES.Identifier) {
                                symbol.value = token.data;
                                token = this.readNext();
                            }
                            this.push(this.add({
                                type: T.FormalParameterList,
                                pos: token.pos
                            }));
                            
                            while (token.data != ")") {
                                if (token.type == TYPES.Identifier) {
                                    this.add({
                                        type: T.Identifier,
                                        value: token.data,
                                        pos: token.pos
                                    });
                                }
                                token = this.readNext();
                            }
                            this.pop(); // FormalParameterList
                            break;
                            
                        case "var":
                            symbol = this.push(this.add({
                                type: T.VariableStatement,
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                            
                        case "try":
                            symbol = this.push(this.add({
                                type: T.TryStatement,
                                pos: token.pos
                            }));
                            break;
                        case "catch":
                            symbol = this.push(this.add({
                                type: T.Catch,
                                pos: token.pos
                            }));
                            break;
                            
                        case "finally":
                            symbol = this.push(this.add({
                                type: T.Finally,
                                pos: token.pos
                            }));
                            break;
                            
                        case "switch":
                            symbol = this.push(this.add({
                                type: T.SwitchStatement,
                                endOnPop: true,
                                pos: token.pos
                            }));
                            break;
                        case "for":
                            symbol = this.push(this.add({
                                type: T.IterationStatement,
                                value: token.data,
                                endOnPop: true,
                                pos: token.pos
                            }));
                            break;
                        case "do":
                            symbol = this.push(this.add({
                                type: T.IterationStatement,
                                value: token.data,
                                pos: token.pos
                            }));
                            break;
                            
                        case "while":
                            if (head.type == T.IterationStatement) {
                            
                            }
                            else {
                            
                                symbol = this.push(this.add({
                                    type: T.IterationStatement,
                                    value: token.data,
                                    endOnPop: true,
                                    pos: token.pos
                                }));
                            }
                            break;
                            
                        case "case":
                            popWhileNot(T.Block);
                            symbol = this.push(this.add({
                                type: T.CaseStatement,
                                pos: token.pos
                            }));
                            
                            symbol = this.push(this.add({
                                type: T.CaseClause,
                                pos: token.pos
                            }));
                            
                            break;
                        case "if":
                            symbol = this.push(this.add({
                                type: T.IfStatement,
                                endOnPop: true,
                                pos: token.pos
                            }));
                            break;
                            
                        case "else":
                            // will be read by the { parser
                            break;
                            
                        case "in":
                            popIfRequired();
                            symbol = this.add({
                                type: T.Keyword,
                                value: token.data,
                                pos: token.pos
                            });
                            break;
                            
                        case "default":
                            popWhileNot(T.Block);
                            symbol = this.push(this.add({
                                type: T.DefaultStatement,
                                pos: token.pos
                            }));
                            
                            symbol = this.push(this.add({
                                type: T.CaseBlock,
                                pos: token.pos
                            }));
                            
                            break;
                        case "throw":
                            symbol = this.push(this.add({
                                type: T.ThrowStatement,
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                        case "this":
                            symbol = this.add({
                                type: T.Keyword,
                                value: token.data,
                                pos: token.pos
                            });
                            break;
                        case "return":
                            symbol = this.push(this.add({
                                type: T.ReturnStatement,
                                pos: token.pos
                            }));
                            break;
                        default:
                            symbol = this.add({
                                type: T.Keyword,
                                value: token.data,
                                pos: token.pos
                            });
                    }
                    break;
                    
                case TYPES.Identifier:
                    switch (head.type) {
                        case T.VariableStatement:
                            symbol = this.push(this.add({
                                type: T.VariableDeclaration,
                                value: token.data,
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                            
                        case T.ObjectLiteral:
                            symbol = this.push(this.add({
                                type: T.PropertyAssignment,
                                pos: token.pos
                            }));
                        //fall through
                        default:
                            
                            symbol = this.add({
                                type: T.Identifier,
                                value: token.data,
                                pos: token.pos
                            });
                    }
                    break;
                    
                case TYPES.StringLiteral:
                    if (head.type == T.ObjectLiteral) {
                        symbol = this.push(this.add({
                            type: T.PropertyAssignment,
                            pos: token.pos
                        }));
                    }
                    this.add({
                        type: T.StringLiteral,
                        value: token.value,
                        pos: token.pos
                    });
                    break;
                    
                case TYPES.NumericLiteral:
                    this.add({
                        type: T.NumericLiteral,
                        value: token.value,
                        pos: token.pos
                    });
                    
                    break;
                    
                case TYPES.BooleanLiteral:
                    this.add({
                        type: T.BooleanLiteral,
                        value: token.data,
                        pos: token.pos
                    });
                    break;
                    
                case TYPES.RegularExpressionLiteral:
                    this.add({
                        type: T.RegularExpressionLiteral,
                        value: token.value,
                        pos: token.pos
                    });
                    break;
                    
                case TYPES.Punctuator:
                    
                    switch (token.data) {
                        case "?":
                            popIfRequired();
                            symbol = this.push(this.add({
                                type: T.TernaryExpression,
                                stream: [{
                                    type: T.BooleanExpression,
                                    stream: [this.take()]
                                }],
                                pos: token.pos
                            }));
                            symbol = this.push(this.add({
                                type: T.TruePart,
                                pos: token.pos
                            }));
                            
                            break;
                        case "!":
                        case "~":
                            symbol = this.push(this.add({
                                type: T.UnaryExpression,
                                value: token.data,
                                pos: token.pos
                            }));
                            break;
                            
                        case "=":
                            if (head.type == T.VariableDeclaration) {
                                this.push(symbol);
                                this.push(this.add({
                                    type: T.Initializer,
                                    pos: token.pos
                                }));
                            }
                            else {
                                if (head.type == T.MemberExpression || head.type == T.DotExpression) {
                                    this.pop();
                                }
                                // replace symbol with AssignmentExpression
                                symbol = this.push(this.add({
                                    type: T.AssignmentExpression,
                                    stream: [this.take()],
                                    pos: token.pos
                                }));
                            }
                            break;
                            
                        case "-": //fall through	
                        case "+":
                            if (head.type == T.AdditiveExpression || head.type == T.MultiplicativeExpression || head.type == T.AssignmentExpression || previousToken.type == TYPES.Semicolon) {
                                symbol = this.push(this.add({
                                    type: T.UnaryExpression,
                                    value: token.data
                                }));
                            }
                            else {
                                symbol = this.push(this.add({
                                    type: T.AdditiveExpression,
                                    stream: [this.take()],
                                    value: token.data,
                                    pos: token.pos,
                                    endOnPop: true
                                }));
                            }
                            break;
                            
                        case "++":
                        case "--":
                            if (symbol.type == T.Identifier) {
                                this.add({
                                    type: T.PostfixExpression,
                                    value: token.data,
                                    stream: [this.take()],
                                    endOnPop: true,
                                    pos: token.pos
                                });
                            }
                            else {
                                this.push(this.add({
                                    type: T.UnaryExpression,
                                    value: token.data
                                }));
                            }
                            break;
                            
                        case "||":
                        case "&&":
                            popWhile(T.UnaryExpression, T.DotExpression, T.MemberExpression, T.AssignmentExpression, T.MultiplicativeExpression, T.AdditiveExpression, T.RelationalExpression);
                            symbol = this.push(this.add({
                                type: T.LogicalExpression,
                                stream: [this.take()],
                                value: token.data,
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                            
                        case "<"://fallthrough
                        case ">"://fallthrough
                        case "<="://fallthrough
                        case ">=":
                            symbol = this.push(this.add({
                                type: T.RelationalExpression,
                                stream: [this.take()],
                                value: token.data,
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                            
                        case "==":
                        case "===":
                        case "!=":
                        case "!==":
                            //popWhile(T.UnaryExpression, T.AssignmentExpression, T.MultiplicativeExpression, T.AdditiveExpression, T.RelationalExpression);
                            symbol = this.push(this.add({
                                type: T.EqualityExpression,
                                value: token.data,
                                stream: [this.take()],
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                            
                        case "/":
                        case "*":
                            symbol = this.push(this.add({
                                type: T.MultiplicativeExpression,
                                value: token.data,
                                stream: [this.take()],
                                pos: token.pos,
                                endOnPop: true
                            }));
                            break;
                        case ".":
                            symbol = this.push(this.add({
                                type: T.DotExpression,
                                value: token.data,
                                stream: [this.take()],
                                pos: token.pos
                            }));
                            break;
                            
                        case ":":
                            switch (head.type) {
                                case T.CaseClause:
                                    this.pop();
                                    symbol = this.push(this.add({
                                        type: T.CaseBlock,
                                        pos: token.pos
                                    }));
                                    break;
                                case T.TruePart:
                                   	popIfRequired();
                                    this.pop();
                                    symbol = this.push(this.add({
                                        type: T.FalsePart,
                                        pos: token.pos
                                    }));
                                    break;
                                    
                            }
                            break;
                            
                        case ",":
                            
                            popWhileNot(T.VariableStatement, T.Arguments, T.GroupingExpression, T.ArrayLiteral, T.ObjectLiteral);
                            break;
                            
                        case "(":
                            
                            if (previousToken.type == TYPES.Identifier || previousToken.data == "]" || previousToken.data == ")") {
                                if (head.type == T.MemberExpression || head.type == T.DotExpression) {
                                    this.pop();
                                }
                                
                                symbol = this.push(this.add({
                                    type: T.CallExpression,
                                    pos: token.pos,
                                    stream: [this.take()]
                                }));
                                this.push(this.add({
                                    type: T.Arguments,
                                    pos: token.pos,
                                    endOnPop: true
                                }));
                            }
                            else {
                                if (previousToken.data == "while") {
                                    symbol = this.push(this.add({
                                        type: T.WhileExpression,
                                        pos: token.pos
                                    }));
                                }
                                else {
                                    switch (head.type) {
                                        case T.Catch:
                                            symbol = this.push(this.add({
                                                type: T.ExceptionIdentifier,
                                                pos: token.pos
                                            }));
                                            break;
                                        case T.IterationStatement:
                                            switch (head.value) {
                                                case "while":
                                                    symbol = this.push(this.add({
                                                        type: T.WhileExpression,
                                                        pos: token.pos
                                                    }));
                                                    
                                                    break;
                                                case "for":
                                                    symbol = this.push(this.add({
                                                        type: T.ForExpression,
                                                        pos: token.pos
                                                    }));
                                                    
                                                    break;
                                                case "forin":
                                                    symbol = this.push(this.add({
                                                        type: T.ForInExpression,
                                                        pos: token.pos
                                                    }));
                                                    
                                                    break;
                                            }
                                            break;
                                            
                                        case T.SwitchStatement:
                                            symbol = this.push(this.add({
                                                type: T.SwitchExpression,
                                                pos: token.pos
                                            }));
                                            break;
                                        case T.IfStatement:
                                            symbol = this.push(this.add({
                                                type: T.BooleanExpression,
                                                pos: token.pos
                                            }));
                                            break;
                                        default:
                                            symbol = this.push(this.add({
                                                type: T.GroupingExpression,
                                                pos: token.pos
                                            }));
                                    }
                                }
                            }
                            break;
                            
                        case ")":
                            popToAndIncluding(T.ExceptionIdentifier, T.CallExpression, T.GroupingExpression, T.BooleanExpression, T.SwitchExpression, T.ForExpression, T.WhileExpression);
                            break;
                            
                        case "[":
                            if (previousToken.type == TYPES.Identifier || previousToken.data == "]" || previousToken.data == ")") {
                                symbol = this.push(this.add({
                                    type: T.MemberExpression,
                                    value: token.data,
                                    stream: [this.take()],
                                    pos: token.pos
                                }));
                                
                            }
                            else {
                                symbol = this.push(this.add({
                                    type: T.ArrayLiteral,
                                    pos: token.pos
                                }));
                            }
                            break;
                            
                        case "]":
                            popToAndIncluding(T.ArrayLiteral, T.MemberExpression);
                            break;
                            
                        case "{":
                            
                            switch (head.type) {
                                case T.FunctionDeclaration:
                                case T.FunctionExpression:
                                    symbol = this.push(this.add({
                                        type: T.SourceElement,
                                        pos: token.pos
                                    }));
                                    break;
                                case T.IfStatement:
                                    symbol = this.push(this.add({
                                        type: previousToken.data == "else" ? T.FalsePart : T.TruePart,
                                        pos: token.pos
                                    }));
                                //fall through
                                case T.SwitchStatement:
                                case T.IterationStatement:
                                case T.BooleanExpression:
                                case T.Catch:
                                case T.Finally:
                                case T.CallExpression:
                                    
                                    symbol = this.push(this.add({
                                        type: T.Block,
                                        pos: token.pos
                                    }));
                                    break;
                                    
                                default:
                                    
                                    switch (previousToken.type) {
                                        case T.Semicolon: //fall through
                                        case T.Keyword:
                                            symbol = this.push(this.add({
                                                type: T.Block,
                                                pos: token.pos
                                            }));
                                            break;
                                            
                                        default:
                                            symbol = this.push(this.add({
                                                type: T.ObjectLiteral,
                                                pos: token.pos
                                            }));
                                    }
                            }
                            break;
                            
                        case "}":
                            // if we are inside some construct, lets pop up to the main block                    
                            if (this.head.type == T.PropertyAssignment) {
                                this.pop();
                                
                            }
                            if (this.head.type == T.CaseBlock) {
                                this.pop(2);
                            }
                            // pop the current symbol
                            this.pop();
                            // check if we need to pop further
                            popIfRequired();
                            switch (this.head.type) {
                                case T.TruePart:
                                    this.pop();
                                    var next = this.peekNext();
                                    if (next.type != TYPES.Keyword || next.data != "else") {
                                        // pop out of the IfStatement
                                        this.pop();
                                    }
                                    break;
                                case T.FalsePart:
                                    // pop out of the IfStatement
                                    this.pop(2);
                                    break;
                                //fallthrough
                                case T.Catch:
                                    this.pop();
                                    break;
                                case T.Finally:
                                    this.pop(2);
                                    break;
                            }
                            break;
                        case ">>":
                        case ">>>":
                        case "<<":
                            symbol = this.push(this.add({
                                type: T.ShiftExpression,
                                value: token.data,
                                stream: [this.take()],
                                pos: token.pos
                            }));
                            break;
                        default:
                            symbol = this.add({
                                type: T.Punctuator,
                                value: token.data,
                                pos: token.pos
                            });
                    }
                    break;
            }
            previousToken = token;
        }
        popWhileNot(T.SourceElement);
        console.log(this.head);
        if (this.stack.length > 2) {
            throw new Error("Non-terminated " + this.stack[this.stack.length - 1].type);
        }
        console.log(this.symbol.stream)
        return this.symbol;
        /*} 
         catch (e) {
         console.log(e)
         console.log("position:" + token.pos.join());
         throw e;
         }*/
    }
};
