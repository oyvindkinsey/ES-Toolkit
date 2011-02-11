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
        if (!this.head.stream || this.head.stream.length === 0) {
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
        NewStatement: "NewStatement",
        SwitchBlock: "SwitchBlock",
        CaseStatement: "CaseStatement",
        DefaultStatement: "DefaultStatement",
        ThrowStatement: "ThrowStatement",
        ReturnStatement: "ReturnStatement",
        CaseClause: "CaseClause",
        IterationStatement: "IterationStatement",
        WhileExpression: "WhileExpression",
        StatementTerminator: "StatementTerminator",
        InExpression: "InExpression",
        LogicalExpression: "LogicalExpression",
        TernaryExpression: "TernaryExpression",
        ForExpression: "ForExpression",
        ForInExpression: "ForInExpression",
        IterationBlock: "IterationBlock ",
        TruePart: "TruePart",
        FalsePart: "FalsePart",
        ForStatement: "ForStatement",
        IfStatement: "IfStatement",
        BreakStatement: "BreakStatement",
        BitwiseExpression: "BitwiseExpression",
        PropertyName: "PropertyName",
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
        NullLiteral: "NullLiteral",
        ShiftExpression: "ShiftExpression"
    },
    log: function(msg){
        console.log("AST: " + msg);
    },
    readNext: function(){
        return this.stream[this.pos++];
    },
    peekNext: function(){
        var pos = this.pos, token;
        while ((token = this.stream[pos++])) {
            if (token.type != Tokenizer.prototype.TYPES.LineTerminator) {
                break;
            }
        }
        return token ||
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
            while (ast.head && !(ast.head.type in types)) {
                ast.pop();
            }
        }
        
        // check if we have fulfilled the current symbols expectancy
        function popFulfilled(){
            while (ast.head.length && ast.head.stream && ast.head.length == ast.head.stream.length) {
                ast.pop();
            }
        }
        //try {
        while (this.pos < this.length) {
            this.token = token = this.readNext();
            head = this.head;
            
            if (token.type == TYPES.CommentMultiLine || token.type == TYPES.CommentMultiLine) {
                continue;
            }
            // todo: implement ASI
            if (token.type == TYPES.LineTerminator) {
                //ignore the LineTerminator unless we need to do ASI
                var asi = false;
                if (previousToken.type != TYPES.Semicolon) {
                    // after comments
                    if (previousToken.type == TYPES.CommentSingleLine || previousToken.type == TYPES.CommentMultiLine) {
                        //asi = true;
                    }
                    
                }
                if (asi) {
                    this.token = token = {
                        type: TYPES.Semicolon
                    };
                }
                else {
                    // skip this token
                    continue;
                }
            }
            if (!head) {
                console.log("no head, breaking");
                console.log([previousToken, symbol])
                return this.symbol
            }
            //this is such a hack!
            if (head.type == T.TryStatement && token.data != "{" && token.data != "finally" && token.data != "catch") {
                this.pop();
                head = this.head;
            }
            switch (token.type) {
                case TYPES.NullLiteral:
                    symbol = this.add({
                        type: T.NullLiteral
                    });
                    break;
                case TYPES.Semicolon:
                    popWhileNot(T.SourceElement, T.Block, T.CaseBlock, T.ForExpression);
                    symbol = this.add({
                        type: T.StatementTerminator
                    });
                    break;
                case TYPES.Keyword:
                    
                    switch (token.data) {
                        case "function":
                            symbol = this.push(this.add({
                                type: (head.type == T.SourceElement) ? T.FunctionDeclaration : T.FunctionExpression,
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
                                pos: token.pos
                            }));
                            break;
                            
                        case "new":
                            symbol = this.push(this.add({
                                type: T.NewStatement,
                                pos: token.pos
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
                                length: 2,
                                pos: token.pos
                            }));
                            break;
                        case "for":
                            symbol = this.push(this.add({
                                type: T.IterationStatement,
                                value: token.data,
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
                                    pos: token.pos
                                }));
                            }
                            break;
                        case "break":
                            popFulfilled();
                            symbol = this.push(this.add({
                                type: T.BreakStatement,
                                pos: token.pos
                            }));
                            
                            break;
                        case "case":
                            popWhileNot(T.Block);
                            symbol = this.push(this.add({
                                type: T.CaseStatement,
                                pos: token.pos,
                                length: 2
                            }));
                            
                            symbol = this.push(this.add({
                                type: T.CaseClause,
                                pos: token.pos,
                                length: 1
                            }));
                            
                            break;
                        case "if":
                            symbol = this.push(this.add({
                                type: T.IfStatement,
                                pos: token.pos
                            }));
                            break;
                            
                        case "else":
                            popWhileNot(T.IfStatement);
                            // will be read by the { parser
                            symbol = this.push(this.add({
                                type: T.FalsePart,
                                pos: token.pos
                            }));
                            if (this.peekNext().data != "{") {
                                symbol.length = 1;
                            }
                            
                            break;
                            
                        case "in":
                            popFulfilled();
                            if (this.head.type == T.VariableDeclaration) {
                                this.pop(2);
                            }
                            symbol = this.push(this.add({
                                type: T.InExpression,
                                stream: [this.take()],
                                length: 2,
                                pos: token.pos
                            }));
                            break;
                            
                        case "default":
                            popFulfilled();
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
                                pos: token.pos
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
                        case "typeof":
                            symbol = this.push(this.add({
                                type: T.UnaryExpression,
                                value: token.data,
                                pos: token.pos,
                                length: 1
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
                                pos: token.pos
                            }));
                            break;
                            
                        case T.ObjectLiteral:
                            symbol = this.push(this.add({
                                type: T.PropertyAssignment,
                                pos: token.pos
                            }));
                            symbol = this.add({
                                type: T.PropertyName,
                                value: token.data,
                                pos: token.pos
                            });
                            break;
                        default:
                            popFulfilled();
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
                        this.add({
                            type: T.PropertyName,
                            value: token.value,
                            pos: token.pos
                        });
                    }
                    else {
                        this.add({
                            type: T.StringLiteral,
                            value: token.value,
                            pos: token.pos
                        });
                    }
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
                            symbol = this.push(this.add({
                                type: T.TernaryExpression,
                                stream: [{
                                    type: T.BooleanExpression,
                                    stream: [this.take()],
                                    length: 1
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
                        case "+=":
                        case "-=":
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
                                    value: token.data,
                                    stream: [this.take()],
                                    length: 2,
                                    pos: token.pos
                                }));
                            }
                            break;
                            
                        case "-": //fall through	
                        case "+":
                            popFulfilled();
                            if (this.head.type == T.RelationalExpression || this.head.type == T.TruePart || this.head.type == T.FalsePart || this.head.type == T.ReturnStatement || this.head.type == T.AdditiveExpression || this.head.type == T.MultiplicativeExpression || this.head.type == T.AssignmentExpression || previousToken.type == TYPES.Semicolon || (previousToken.type == TYPES.Punctuator && previousToken.data == ",")) {
                                symbol = this.push(this.add({
                                    type: T.UnaryExpression,
                                    value: token.data
                                }));
                            }
                            else {
                                symbol = this.push(this.add({
                                    type: T.AdditiveExpression,
                                    stream: [this.take()],
                                    length: 2,
                                    value: token.data,
                                    pos: token.pos
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
                            popFulfilled();
                            symbol = this.push(this.add({
                                type: T.LogicalExpression,
                                stream: [this.take()],
                                value: token.data,
                                pos: token.pos
                            }));
                            break;
                            
                        case "|":
                        case "&":
                        case "^":
                            popFulfilled();
                            symbol = this.push(this.add({
                                type: T.BitwiseExpression,
                                stream: [this.take()],
                                value: token.data,
                                pos: token.pos
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
								length:2
                            }));
                            break;
                            
                        case "==":
                        case "===":
                        case "!=":
                        case "!==":
                            popFulfilled();
                            //popWhile(T.UnaryExpression, T.AssignmentExpression, T.MultiplicativeExpression, T.AdditiveExpression, T.RelationalExpression);
                            symbol = this.push(this.add({
                                type: T.EqualityExpression,
                                value: token.data,
                                stream: [this.take()],
                                length: 2,
                                pos: token.pos
                            }));
                            break;
                            
                        case "/":
                        case "*":
                        case "%":
                            symbol = this.push(this.add({
                                type: T.MultiplicativeExpression,
                                value: token.data,
                                stream: [this.take()],
                                length: 2,
                                pos: token.pos
                            }));
                            break;
                        case ".":
                            symbol = this.push(this.add({
                                type: T.DotExpression,
                                value: token.data,
                                stream: [this.take()],
                                pos: token.pos,
                                length: 2
                            }));
                            break;
                            
                        case ":":
                            popWhileNot(T.CaseStatement, T.TernaryExpression, T.ObjectLiteral, T.DefaultStatement, T.PropertyAssignment);
                            switch (this.head.type) {
                                case T.CaseStatement:
                                    symbol = this.push(this.add({
                                        type: T.CaseBlock,
                                        pos: token.pos
                                    }));
                                    break;
                                case T.TernaryExpression:
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
                            switch (head.type) {
                                case T.Catch:
                                    symbol = this.push(this.add({
                                        type: T.ExceptionIdentifier,
                                        pos: token.pos
                                    }));
                                    break;
                                case T.IterationStatement:
                                    switch (head.value) {
                                        case "do":
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
                                case T.UnaryExpression:
                                    symbol = this.push(this.add({
                                        type: T.GroupingExpression,
                                        pos: token.pos
                                    }));
                                    break;
                                default:
                                    switch (symbol.type) {
                                        case T.Identifier:
                                        case T.MemberExpression:
                                        case T.DotExpression:
                                        case T.GroupingExpression:
                                        case T.CallExpression:
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
                            
                            
                            break;
                            
                        case ")":
                            popToAndIncluding(T.BooleanExpression, T.ExceptionIdentifier, T.CallExpression, T.GroupingExpression, T.BooleanExpression, T.SwitchExpression, T.ForExpression, T.WhileExpression);
                            
                            if (this.head.type == T.IfStatement) {
                                symbol = this.push(this.add({
                                    type: T.TruePart,
                                    pos: token.pos
                                }));
                            }
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
                                    
                                case T.ReturnStatement:
                                    symbol = this.push(this.add({
                                        type: T.ObjectLiteral,
                                        pos: token.pos
                                    }));
                                    break;
                                default:
                                    
                                    if ((head.type == T.TruePart || head.type == T.FalsePart) && this.stack[this.stack.length - 2].type == T.IfStatement) {
                                        symbol = this.push(this.add({
                                            type: T.Block,
                                            pos: token.pos
                                        }));
                                    }
                                    else {
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
                            }
                            break;
                            
                        case "}":
                            // pop up to the nearest symbol terminated by }
                            popWhileNot(T.SourceElement, T.Block, T.ObjectLiteral, T.TruePart, T.FalsePart);
                            
                            // pop the }
                            this.pop();
                            switch (this.head.type) {
                                case T.TruePart:
                                    if (this.stack[this.stack.length - 2].type == T.IfStatement) {
                                        this.pop();
                                        var next = this.peekNext();
                                        if (next.type != TYPES.Keyword || next.data != "else") {
                                            // pop out of the IfStatement
                                            this.pop();
                                        }
                                    }
                                    break;
                                case T.Finally:
                                case T.FalsePart:
                                    if (this.head.type == T.IfStatement || this.head.type == T.FalsePart) {
                                        // pop out of the IfStatement
                                        this.pop(2);
                                    }
                                    break;
                                case T.FunctionDeclaration:
                                case T.FunctionExpression:
                                case T.Catch:
                                    this.pop();
                                    break;
                            }
                            popFulfilled();
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
            //            throw new Error("Non-terminated " + this.stack[this.stack.length - 1].type);
            console.log("Non-terminated " + this.stack[this.stack.length - 1].type);
        }
        console.log(this.symbol.stream);
        return this.symbol;
        /*} 
         catch (e) {
         console.log(e)
         console.log("position:" + token.pos.join());
         throw e;
         }*/
    }
};
