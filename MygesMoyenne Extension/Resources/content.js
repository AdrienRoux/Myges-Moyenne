browser.runtime.sendMessage({message: ""}).then(() => {
    setupOnChange()
    load()
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);
});

function setupOnChange() {
    new MutationObserver(function(mutationsList, observer) {
        if (mutationsList.length == 4) {
            var div = document.getElementsByClassName('moyenne-description')[0]
            if (div !== undefined) {
                div.remove()
            }
            load();
        }
    }).observe(document.getElementsByClassName("mg_loadingbar_container")[0], { characterData: false, childList: false, attributes: true })
}

function load() {
    var trs = document.querySelectorAll("tr[role='row']");
    var count = 0;
    for (let i = 0; i < trs.length; i++) {
        if (trs[i].getElementsByTagName("th").length > 0) {
            count += 1;
            if (count == 2) {
                trs = Array.from(trs).slice(0, i)
            }
        }
    }
    trs[0].appendChild(createHeaderNode("Moyenne"));
    trs.shift()
    
    var moyenneGeneraleSum = 0.0
    var moyenneGeneraleCount = 0
    var coefCount = 0
    var ectsCount = 0
    var ccSum = 0.0
    var ccCount = 0
    var examSum = 0.0
    var examCount = 0
    
    for (let i = 0; i < trs.length; i++) {
        var values = [];
        var sum = 0.0;
        var count = 0;
        var exam_grade = -1;
        
        for (let j = 0; j < trs[i].children.length; j++) {
            if (j == 0 || j == 1) {
                values.push(trs[i].children[j].firstChild.innerHTML)
            } else {
                values.push(trs[i].children[j].innerHTML)
            }
        }
        
        if (values[2] !== "N.C" && values[2] !== "") {
            for (let j = 0; j < values.length - 1; j++) {
                if (j > 3) {
                    if (values[j] !== "") {
                        const value = parseFloat(values[j].replace(/,/g,'.'))
                        sum += value
                        count++
                        
                    }
                }
            }
            
            if (values[values.length - 1] !== "") {
                exam_grade = parseFloat(values[values.length - 1].replace(/,/g,'.'))
                examSum += exam_grade * parseFloat(values[2])
                examCount += parseFloat(values[2])
            }
        }
        
        if (count !== 0) {
            var result = sum / count
            var string = ""
            
            ccSum += (result * parseInt(values[2]))
            ccCount += parseInt(values[2])
            
            if (exam_grade !== -1) {
                result = (result * 1.0 + exam_grade * 1.0) / 2
            }
            
            if (result % 1 != 0) {
                string = result.toFixed(2);
            } else {
                string = result.toString();
            }
            const value = string.replaceAll('.', ',')
            trs[i].appendChild(createCellNode(value))
            values.push(value)
        } else {
            var value = ""
            
            if (exam_grade !== -1) {
                value = exam_grade.toString().replaceAll('.', ',')
                trs[i].appendChild(createCellNode(value))
            } else {
                trs[i].appendChild(createCellNode(""))
            }
            values.push(value)
        }
        
        if (values[values.length - 1] !== "") {
            moyenneGeneraleSum += (values[values.length - 1].replaceAll(',', '.') * parseFloat(values[2]))
            moyenneGeneraleCount += parseFloat(values[2])
            
            if (parseFloat(values[values.length - 1]) >= 10) {
                trs[i].children[3].style["color"] = "#26bf33";
                coefCount += parseInt(values[2])
                ectsCount += parseInt(values[3])
            } else {
                trs[i].children[3].style["color"] = "red";
            }
        }
    }
    
    if (moyenneGeneraleCount !== 0) {
        const moyenneGenerale = (moyenneGeneraleSum / moyenneGeneraleCount).toFixed(2).replaceAll('.', ',')
        var div = document.querySelectorAll('div.mg_widget_border')
        var moyenneCC = ""
        var moyenneExam = ""
        
        if (ccCount > 0) {
            var result = (ccSum / ccCount)
            if (result % 1 != 0) {
                moyenneCC = result.toFixed(2).replaceAll('.', ',');
            } else {
                moyenneCC = result.toString();
            }
        }
        
        if (examCount > 0) {
            var result = (examSum / examCount)
            if (result % 1 != 0) {
                moyenneExam = result.toFixed(2).replaceAll('.', ',')
            } else {
                moyenneExam = result.toString()
            }
        }
        
        div[0].appendChild(description(moyenneGenerale, moyenneGeneraleSum.toFixed(2).replaceAll('.', ','), coefCount.toString(), ectsCount.toString(), moyenneCC, moyenneExam))
    }
}

function description(moyenneGenerale, points, coefs, ects, moyenneCC, moyenneExams) {
    var div = document.createElement("div")
    div.classList.add('moyenne-description')
    div.style["text-align"] = "center"
    
    if (parseFloat(moyenneGenerale) >= 11 || (parseInt(ects) === 30 && parseFloat(moyenneGenerale) > 10)) {
        addBrToEnd(div)
        div.appendChild(createSwooshNodeOK("Semestre Valide 🎉"))
    } else {
        addBrToEnd(div)
        div.appendChild(createSwooshNodeNotOK("Semestre Invalide"))
    }
    
    div.appendChild(document.createElement("br"))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-size: 12px;">Moyenne générale : </span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-weight: bold; font-size: 12px;">' + moyenneGenerale + '</span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-size: 12px;">  Points : </span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-weight: bold; font-size: 12px;">' + points + '</span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-size: 12px;">  Coefs : </span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-weight: bold; font-size: 12px;">' + coefs + '</span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-size: 12px;">  ECTS : </span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-weight: bold; font-size: 12px;">' + ects + '</span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-size: 12px;">  Moyenne des CC : </span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-weight: bold; font-size: 12px;">' + moyenneCC + '</span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-size: 12px;">  Moyenne des examens : </span>'))
    div.appendChild(htmlToElement('<span class="mg_content mg_inherit_color" style="font-weight: bold; font-size: 12px;">' + moyenneExams + '</span>'))
    div.appendChild(document.createElement("br"))
    div.appendChild(document.createElement("br"))
    
    return div
}

//points base 2 coef si > 2 -> /2 sinon 1

function addBrToEnd(node) {
    node.appendChild(document.createElement("br"))
}

function createSwooshNodeOK(content) {
    return htmlToElement('<div><svg xmlns="http://www.w3.org/2000/svg"><filter id="motion-blur-filter" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="100 0"></feGaussianBlur></filter></svg><span class="moyenne_text_ok" filter-content="S" style="color: green">' + content + '</span></div>')
}

function createSwooshNodeNotOK(content) {
    return htmlToElement('<div><span class="moyenne_text_not_ok" filter-content="S">' + content + '</span></div>')
}

function createCellNode(content) {
    return htmlToElement("<td role=\"gridcell\" style=\"width:55px;text-align: center\">" + content + "</td>");
}

function createHeaderNode(title) {
    return htmlToElement("<th class=\"ui-state-default\" role=\"columnheader\" style=\"width:55px;text-align: center\"><span class=\"ui-column-title\">" + title + "</span></th>")
}


function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}
