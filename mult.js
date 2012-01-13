(function(root){
	
	function prep(n1,n2){
		var temp, state = {
			n: 0,
			t: 0,
			mems: 0,
			mem: 0,
			at: "setup"
		};
		if ((""+n1).replace(/0{1,}$/g,"").replace(/\./,"").length > (""+n2).replace(/0{1,}$/g,"").replace(/\./,"").length){
			state.switched = true;
			temp = n1;
			n1 = n2;
			n2 = temp;
		}
		[[n1,"num"],[n2,"target"]].forEach(function(el){
			var str = ""+el[0],
				pre = el[1];
			state[pre] = str;
			state[pre+"zeroes"] = (str.match(/0{1,}$/g) || [""])[0].length;
			state[pre+"dec"] = (str.match(/\..*/g) || ["X"])[0].length-1;
			state[pre+"digits"] = str.replace(/0{1,}$/g,"").replace(/\./,"").split("").map(function(d){return Number(d);});
		});
		state.maxzeroes = Math.max(state.targetzeroes,state.numzeroes)
		state.frag = $(draw(state));
		return state;
	}
	
	function draw(state){
		var maxdigits = Math.max(state.targetdigits.length,state.numdigits.length),
			memwidth = Math.max(3,Math.ceil((state.targetdigits.length * state.numdigits.length)/(state.numdigits.length+2))),
			mem = 1,
			digwidth = state.targetdigits.length+1,
			totaldigwidth = digwidth+state.numdigits.length-1,
			digpadding = totaldigwidth-digwidth,
			maxzeroes = state.maxzeroes;
		html = "<div><div class='step'><div class='info'></div><table class='calc'>";
//		console.log(memwidth,"Total mem",state.targetdigits.length * state.numdigits.length,"rows",state.numdigits.length+2,"perrow",Math.max(3,Math.ceil((state.targetdigits.length * state.numdigits.length)/(state.numdigits.length+2))));
		["target","num"].forEach(function(pre){
			dgs = state[pre+"digits"];
			html+="<tr class='digit "+pre+"'><td></td>";
			// digpadding
			html+=(new Array(digpadding+1)).join("<td></td>")
			// lead cell
			html+="<td class='lead"+(pre==="num"?"'>*":"empty'>")+"</td>";
			// digits
			var missing = maxdigits-dgs.length;
			for(var i = 0; i<maxdigits; i++){
//				console.log(dgs.join(""),"nbrofdec:",state[pre+"dec"],"missing",missing,"now:",dgs[i-missing],"at",i,"1stdec",i==missing+dgs.length-state[pre+"dec"]);
				html += "<td class='digit"+(i>=missing?(state[pre+"dec"] && i==missing+dgs.length-state[pre+"dec"]?" firstdec":"")+"' id='"+pre+(dgs.length-i+missing)+"'>"+dgs[i-missing]:"empty'>")+"</td>";
			}
			for(var i=1; i<= maxzeroes; i++){
				html += "<td class='zero"+(state[pre+"zeroes"]>=i?"'>0":"empty'>")+"</td>";
			}
			//spacing
			html += "<td></td>";
			//memcols
			for(i=0;i<memwidth;i++){
				html+= "<td class='mem' id='mem"+(mem++)+"'></td>";
			}
			//end
			html += "</tr>";
		});
		// answerrows
		for(i=0;i<state.numdigits.length;i++){
			html+="<tr id='multrow"+(i+1)+"' class='multrow hidden'>";
			// lead padding
			html+= (new Array(Math.max(0,digpadding-i+1))).join("<td></td>");
			// 'plustd'
			html+= "<td"+(i && i === state.numdigits.length-1?" id='plus' class='aboveplus'":"")+"></td>";
			// answerdigits
			for(var j=0;j<=state.targetdigits.length;j++){
				html += "<td class='ans"+(i==state.numdigits.length-1?" aboveplus":"")+"' id='ans"+(i+1)+"-"+(state.targetdigits.length-j+1)+"'></td>";
			}
			// trailing padding
			html+= (new Array(i+1)).join("<td"+(i==state.numdigits.length-1?" class='aboveplus'":"")+"></td>");
			html+= (new Array(maxzeroes+2)).join("<td></td>");
			//memcols
			for(j=0;j<memwidth;j++){
				html+= "<td class='mem' id='mem"+(mem++)+"'></td>";
			}
			html+="</tr>";
		}
		// addrow
		if (state.numdigits.length>1){
			html+="<tr class='plus hidden'>";
			for(i=state.targetdigits.length+state.numdigits.length+1;i;i--){
				html+="<td class='plusdigit' id='plus"+i+"'></td>";
			}
			for(i=1;i<maxzeroes+2+memwidth;i++){
				html+="<td id='anszero"+i+"'></td>";
			}
			html+="</tr>";
		}
		return html+="</table></div></div>";
	}
	
	function clearHighlights(frag){
		["highlightnum","highlighttarget","highlightans","highlightmemold","highlightmemnew"].forEach(function(h){
			frag.find("."+h).removeClass(h);
		});
		return frag;
	}
	
	function setup(state){
		var frag = state.frag = clearHighlights(state.frag),
			msg = "Skriv upp <span class='highlightnum'>"+state.num+"</span> och <span class='highlighttarget'>"+
					state.target+"</span> ovanför varandra så att de slutar i samma kolumn. ";
		if (Math.max(state.targetzeroes,state.numzeroes)){
			msg+= "Låt nollor i slutet 'skjuta ut', de behöver vi inte ta hänsyn till förrän i slutet.";
		}
		frag.find("tr.target .digit").addClass("highlighttarget");
		frag.find("tr.num .digit").addClass("highlightnum");
		frag.find(".info").html(msg);
		state.at = "beginrow";
		return state;
	}
	
	function beginrow(state){
		var frag = state.frag = clearHighlights(state.frag),
			msg;
		state.t = 1;
		state.n++;
		// rows
		$("#num"+state.n,frag).addClass("highlightnum");
		$("tr.target .digit",frag).addClass("highlighttarget");
		if (state.n == 1){
			msg = "Nu ska vi gångra alla siffrorna i <span class='highlighttarget'>"+state.target+
				"</span> med siffrorna i "+state.numdigits.join("")+", en i taget. Vi börjar längst till höger med <span class='highlightnum'>"+
				state.numdigits[state.numdigits.length-1]+"</span>."+
				" Resultaten kommer vi skriva <span class='highlightans'>nedanför</span>.";
		}
		// following row
		else {
			msg = "Nu är det nästa siffra, <span class='highlightnum'>"+state.numdigits[state.numdigits.length-state.n]+
				"</span>, som ska gångras med siffrorna i <span class='highlighttarget'>"+state.target+"</span>."+
				" Resultatet skriver vi på en <span class='highlightans'>ny rad</span>, ett steg till vänster om den ovan.";
		}
		// result
		$("#multrow"+state.n,frag).removeClass("hidden").find("td.ans").addClass("highlightans");

		$(".info",frag).html(msg);
		state.at = "mult";
		return state;
	}
	
	function mult(state){
		var frag = state.frag = clearHighlights(state.frag),
			n = state.numdigits[state.numdigits.length-state.n],
			t = state.targetdigits[state.targetdigits.length-state.t],
			res = n*t,
			endres = n*t+(state.mem||0),
			first = endres % 10,
			second = Math.floor(endres/10),
			msg;
		// initial multiplication
		msg = (state.t!==1?"":"Vi börjar med ")+
			  "<span class='highlightnum'>"+n+"</span>*"+
			  "<span class='highlighttarget'>"+t+"</span> = "+(n*t)+". ";
		$("#num"+state.n,frag).addClass("highlightnum");
		$("#target"+state.t,frag).addClass("highlighttarget");

		// eventual old mem
		if (state.mem){
			msg += "Vi hade <span class='highlightmemold'>"+state.mem+"</span> i minne, så vi stryker det och får "+res+"+"+state.mem+"="+endres+".";
			$("#mem"+state.mems,frag).addClass("highlightmemold");
			state.mem = 0;
		}
		// first answerpart
		msg += " Vi skriver "+(second?"entalen ":"")+"<span class='highlightans'>"+first+"</span> i "+
			(state.t==1?"första resultatrutan":"nästa resultatruta");
		$("#ans"+state.n+"-"+state.t,frag).text(first).addClass("highlightans");
		// eventual new mem
		if (second){
			if (state.t === state.targetdigits.length){
				msg += ". Eftersom <span class='highlighttarget'>"+t+"</span> är sista siffran så kan vi direkt skriva även <span class='highlightmemnew'>"+second+"</span>"+" i resultatraden";
				$("#ans"+state.n+"-"+(state.t+1),frag).text(second).addClass("highlightmemnew");
			} else {
				state.mem = second;
				msg += " och sparar <span class='highlightmemnew'>"+second+"</span> i minne";
				if (!state.mems){
					msg+= ". Skriv upp den någonstans vid sidan av din uträkning";
				}
				state.mems++;
				$("#mem"+state.mems,frag).addClass("highlightmemnew").text(second);
			}
		}
		msg+="."
		
		$(".info",frag).html(msg);

		state.t++;
		if (state.t === state.targetdigits.length+1){
			if (state.n === state.numdigits.length){
				state.at = "setupadd";
			} else {
				state.at = "beginrow";
			}
		}

		return state;
	}
	
	function setupadd(state){
		var frag = state.frag = clearHighlights(state.frag),
			msg = "Dags att ta fram slutresultatet! Det gör vi genom att addera alla "+
			"<span class='highlightans'>delresultat</span> till <span class='highlightmemnew'>raden nedanför<span class='highlightmemnew'>.";
		frag.find("tr.plus").removeClass("hidden");
		frag.find("td.ans").addClass("highlightans");
		frag.find("td.plusdigit").addClass("highlightmemnew");
		frag.find("td.aboveplus").addClass("borderbottom");
		frag.find("td#plus").text("+");
		frag.find(".info").html(msg);
		state.at = "fillinadd";
		return state;
	}
	
	function fillinadd(state){
		var frag = state.frag = clearHighlights(state.frag),
			sum = Number(state.targetdigits.join(""))*Number(state.numdigits.join("")),
			sumdigits = (""+sum).split(""),
			msg = "Nu adderar vi kolumn för kolumn, och får fram summan "+sum+"!";
		for(var i=0;i<=sumdigits.length;i++){
			frag.find("#plus"+(i)).text(sumdigits[sumdigits.length-i]);
		}
		frag.find(".info").html(msg);
		if (state.maxzeroes){
			state.at = "usezeroes"
		} else {
			state.at = "stop";
		}
		return state;
	}
	
	function usezeroes(state){
		
	}
	
	root.M = {
		usezeroes: usezeroes,
		fillinadd: fillinadd,
		setupadd: setupadd,
		setup: setup,
		beginrow: beginrow,
		prep: prep,
		draw: draw,
		mult: mult
	};
})(this);