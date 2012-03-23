(function(){
	setNbrOfDec = function(num,dec){
		var res = (""+num).split(".");
		return res.length === 2 ? Number(res[0]+"."+(res[1].substr(0,dec))) : res[0];
	};
	getNbrOfDec = function(num){
		var res = (""+num).split(".");
		return res.length === 1 ? 0 : res[1].length;
	};
	_op = function(num1,num2,fn){
		var res = fn(Number(num1),Number(num2));
		expectedNbrOfDec = Math.max(getNbrOfDec(num1),getNbrOfDec(num2));
		return setNbrOfDec(res,expectedNbrOfDec);
	};
	add = function(num1,num2){ return _op(num1,num2,function(o1,o2){return o1+o2;}); };
	multiply = function(num1,num2){ return _op(num1,num2,function(o1,o2){return o1*o2;}); };
	subtract = function(num1,num2){ return _op(num1,num2,function(o1,o2){return o1-o2;}); };
	Math.setNbrOfDec = setNbrOfDec;
	Math.getNbrOfDec = getNbrOfDec;
	Math.add = add;
	Math.multiply = multiply;
	Math.subtract = subtract;
}());