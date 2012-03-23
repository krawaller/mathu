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
			state[pre+"fixed"] = (""+str).replace(/0*$/g,"");
			state[pre+"zeroes"] = (str.match(/0{1,}$/g) || [""])[0].length;
			state[pre+"dec"] = (str.match(/\..*/g) || ["X"])[0].length-1;
			state[pre+"digits"] = str.replace(/0{1,}$/g,"").replace(/\./,"").split("").map(function(d){return Number(d);});
		});
		state.maxzeroes = Math.max(state.targetzeroes,state.numzeroes)
		state.totalzeroes = state.targetzeroes+state.numzeroes;
		state.totaldec = state.numdec + state.targetdec;
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
			html+="<td class='lead"+(pre==="num"?"'>&middot;":"empty'>")+"</td>";
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
		var len = state.numdigits.length;
		for(i=0;i<len;i++){
			html+="<tr id='multrow"+(i+1)+"' class='multrow hidden'>";
			// lead padding
			html+= (new Array(Math.max(0,digpadding-i+1))).join("<td></td>");
			// 'plustd'
			html+= "<td"+(i && i === state.numdigits.length-1?" id='plus' class='aboveplus'":"")+"></td>";
			// answerdigits
			for(var j=0;j<=state.targetdigits.length;j++){
				html += "<td class='ans"+(len>1 && i==len-1?" aboveplus":"")+"' id='ans"+(i+1)+"-"+(state.targetdigits.length-j+1)+"'></td>";
			}
			if (len > 1){
				// trailing padding
				html+= (new Array(i+1)).join("<td"+(i==len-1? " class='aboveplus'":"")+"></td>");
				html+= (new Array(maxzeroes+2)).join("<td></td>");
				//memcols
				for(j=0;j<memwidth;j++){
					html+= "<td class='mem' id='mem"+(mem++)+"'></td>";
				}
			} else {
				console.log("SINGLEDIGIT")
				for(j=1;j<maxzeroes+2+memwidth;j++){
					html+="<td id='anszero"+j+"'></td>";
				}
			}
			html+="</tr>";
		}
		// addrow
		if (len>1){
			html+="<tr class='plus hidden'>";
			for(i=state.targetdigits.length+len+1;i;i--){
				html+="<td class='plusdigit' id='ans"+(len+1)+"-"+i+"'></td>";
			}
			for(i=1;i<maxzeroes+2+memwidth;i++){
				html+="<td id='anszero"+i+"'></td>";
			}
			html+="</tr>";
		}
		return html+="</table></div></div>";
	}
	
	function clearHighlights(frag){
		["zero","num","target","ans","memold","memnew","dec"].forEach(function(h){
			h = "highlight"+h;
			frag.find("."+h).removeClass(h);
		});
		return frag;
	}
	
	function setup(state){
		var frag = state.frag = clearHighlights(state.frag),
			msg = "Skriv upp <span class='highlightnum'>"+state.num+"</span> och <span class='highlighttarget'>"+
					state.target+"</span> ovanför varandra så att de slutar i samma kolumn. ";
		if (state.totaldec){
			msg += "Var decimalkommat hamnat spelar ingen roll. "
		}
		if (state.totalzeroes){
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
			msg = "Nu ska vi gångra alla siffrorna i <span class='highlighttarget'>"+state.targetfixed+
				"</span> med siffrorna i "+state.numfixed+", en i taget. Vi börjar längst till höger med <span class='highlightnum'>"+
				state.numdigits[state.numdigits.length-1]+"</span>."+
				" Resultaten kommer vi skriva <span class='highlightans'>nedanför</span>.";
		}
		// following row
		else {
			msg = "Nu är det nästa siffra, <span class='highlightnum'>"+state.numdigits[state.numdigits.length-state.n]+
				"</span>, som ska gångras med siffrorna i <span class='highlighttarget'>"+state.targetfixed+"</span>."+
				" Resultatet kommer vi skriva på en <span class='highlightans'>ny rad</span>, ett steg till vänster om den ovan.";
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
			  "<span class='highlightnum'>"+n+"</span>&middot;"+
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

		state.t++;
		if (state.t === state.targetdigits.length+1){ // finished multiplying a row
			if (state.n === state.numdigits.length){ // finished with last row
				msg += " Nu har vi gångrat klart!"
				state.at = "done";
				if (state.numdigits.length>1){
					state.at = "setupadd";
				} else {
					if (state.totalzeroes) {
						state.at = "movezeroes"
					} else {
						if (state.totaldec){
							state.at = "usedecimals";
						}
					}
				}
			} else {
				state.at = "beginrow";
			}
		}

		$(".info",frag).html(msg);

		return state;
	}
	
	function done(state){
		var frag = state.frag = clearHighlights(state.frag),
			ans = ""+Number(state.targetdigits.join(""))*Number(state.numdigits.join(""));

		if(state.totalzeroes){
			ans+= (new Array(state.totalzeroes+1)).join("0");
		}
		if(state.totaldec){
			ans = ans.substr(0,ans.length-state.totaldec)+","+ans.substr(ans.length-state.totaldec,100);
		}
		frag.find("tr.target .digit").add(frag.find("tr.target .zero")).addClass("highlighttarget");
		frag.find("tr.num .digit").add(frag.find("tr.num .zero")).addClass("highlightnum");
		frag.find(".ansused").addClass("highlightans");
		frag.find(".info").html("Vi är nu helt klara, och har kommit fram till att <span class='highlighttarget'>"+state.target+"</span> &middot; <span class='highlightnum'>"+state.num+"</span> = <span class='highlightans'>"+ans+"</span>!");
		state.at = "stop";
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
			msg = "Nu adderar vi kolumn för kolumn, och får fram summan <span class='highlightans'>"+sum+"</span>!";
		for(var i=0;i<=sumdigits.length;i++){
			frag.find("#ans"+(state.numdigits.length+1)+"-"+(i)).addClass("ansused highlightans").text(sumdigits[sumdigits.length-i])
		}
		frag.find(".info").html(msg);
		state.at = "done";
		if (state.totalzeroes){
			state.at = "movezeroes";
		} else if (state.totaldec){
			state.at = "usedecimals";
		}
		return state;
	}
	
	function movezeroes(state){
		var frag = state.frag = clearHighlights(state.frag),
			z = state.totalzeroes,
			msg = "Eftersom vi hade <span class='highlightzero'>"+z+" noll"+(z>1?"or":"a")+"</span> i faktorerna så måste vi nu <span class='highlightans'>lägga till "+(z>1?"dessa":"den")+" i svaret</span>! ";
		if (state.totaldec){
			state.at = "usedecimals";
		} else {
			state.at = "done";
		}
		for(var i=1;i<=state.totalzeroes;i++){
			frag.find("#anszero"+i).text("0").addClass("highlightans").addClass('ansused');
			frag.find(".zero").addClass("highlightzero");
		}
		frag.find(".info").html(msg);
		return state;
	}
	
	function usedecimals(state){
		var frag = state.frag = clearHighlights(state.frag),
			d = state.totaldec,
			msg = "Faktorerna har <span class='highlightdec'>"+d+" decimal"+(d>1?"er":"")+"</span>, så svaret måste också ha <span class='highlightans'>"+d+" decimal"+(d>1?"er":"")+"</span>. Skriv in decimalkommat på rätt plats."
		frag.find(".info").html(msg);
		if (state.numdec){
			for(var i=1;i<=state.numdec;i++){
				frag.find("#num"+i).addClass("highlightdec");
			}
		}
		if (state.targetdec){
			for(var i=1;i<=state.targetdec;i++){
				frag.find("#target"+i).addClass("highlightdec");
			}
		}
		var t = state.totaldec - state.totalzeroes;
		if (t === 0){
			t = -1;
		}
		if (t>0){
			for(i=1;i<=t;i++){
				frag.find("#ans"+(state.numdigits.length+(state.numdigits.length>1?1:0))+"-"+i).addClass("highlightans"+(i===t?" firstdec":""));
			}
		}
		//the zeroes
		var skip = state.totalzeroes-state.totaldec;
		for(i=1;i<=state.totalzeroes;i++){
			console.log("zero",i,"total",state.totalzeroes,"dec",state.totaldec,"condition",state.totalzeroes-i>state.totaldec);
			if (skip<i){
				frag.find("#anszero"+i).addClass("highlightans"+(i===skip+1?" firstdec":""))
			}
		}
		state.at = "done";
		return state;
	}
	
	root.M = {
		movezeroes: movezeroes,
		usedecimals: usedecimals,
		done: done,
		fillinadd: fillinadd,
		setupadd: setupadd,
		setup: setup,
		beginrow: beginrow,
		prep: prep,
		draw: draw,
		mult: mult
	};
})(this);