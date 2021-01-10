import search from "./lattice-graph-search.js"

const $result = $('#result').css('color', 'grey')
const $container = $('.sum-container');
const $intervalInfo = $('#interval-info-container').hide();
const $threshInfo = $('#thresh-info-container').hide();

$('#lightness input')
    .on('change', event => {
        lightnessPercent = event.target.value
        $('line').add('text').each(function() {
            let attr = (this.nodeName == 'text')? 'fill' : 'stroke'
            let stroke = $(this).attr(attr) || ""
            if (stroke.startsWith('hsl')) {
                let hslTriplet = stroke.split(",")
                hslTriplet[2] = lightnessPercent + "%)"
                $(this).attr(attr, hslTriplet.join(","))
            }
        })
    })

$('#thresh input')
    .on('input', event => threshold = Math.min(event.target.value/100, 1))
    .on('focus', e => $threshInfo.show())
    .on('blur', e => $threshInfo.hide())
    
$('#plus-button').on('click', addIntervalField)
$('#first-field')
    .on('input', updateIntervals)
    .on('focus', e => $intervalInfo.show())
    .on('blur', e => $intervalInfo.hide())

tune.ETInterval.prototype.toString = function() {
    return `${this.n}#${this.d}`
}

tune.Cents.prototype.toString = function() {
    return `${this.cents()}¢`
}

let intervals = []

function addIntervalField() {
    let $button = $('<button><img class="minus-button" src="assets/minus-icon.png"/></button>')
        .on('click', () => { $intervalField.remove(), updateIntervals() })
    let $input = $('<input type="text" maxlength="7">')
        .on('input', updateIntervals)
        .on('focus', e => $intervalInfo.show())
        .on('blur', e => $intervalInfo.hide())
    let $intervalField = $(`<div class="interval-field"></div>`)
        .append($button)
        .append($input)

    $('#interval-line').append($intervalField)
    return $input.trigger('focus')
}

// Initialize parameters
$('#first-field').val('5:4')
addIntervalField().val('3:2')
addIntervalField().val('7:4')
$('#thresh').find('input').val(1)
updateIntervals()
document.activeElement.blur()

// Use the value of the fields to
function updateIntervals() {
    intervals = []
    $('#interval-line').children().each((i, e) => {
        let $elem = $(e).find("input")
        let interval = parseIntervalText($elem.val())
        if (!interval) {
            $elem.addClass('invalid-field')
        } else {
            $elem.removeClass('invalid-field')
            intervals.push(interval)
        }
    })
}


//let primes = [3, 5, 7, 11, 13]
//let intervalRatios = primes.map(p => [p, (2**Math.floor(Math.log2(p)))])
//let intervals = intervalRatios.map(([a, b]) => a / b)
let lightnessPercent = 50;
let threshold = 0.01
let w = document.body.clientWidth
let h = 1000
let marginLeft = 100
let marginBottom = 500
let zeroY = h - marginBottom
let twelveHeight = 100
let twelveY = zeroY - twelveHeight

window.onresize = function() {
    w = document.body.clientWidth
    svg.size(w, h)
    yAxis.plot(marginLeft, 0, marginLeft, h)
    xAxis.plot(0, zeroY, w, zeroY)
}

let svg = SVG().addTo('#canvas').size(w, h)
svg.css({
    'background': 'transparent',
    'border-radius': '10px'
})

// y axis
let yAxis = svg.line(marginLeft, 0, marginLeft, h)
    .stroke({color: 'darkgrey', width: 2, 'dasharray': "10,5"})
// y range
svg.line(marginLeft, twelveY, marginLeft, zeroY)
    .stroke({color: 'red', width: 3})
    .opacity(0.5)
// x axis
let xAxis = svg.line(0, zeroY, w, zeroY)
    .stroke({color: 'darkgrey', width: 2, 'dasharray': "10,5"})
// y hash
svg.line(marginLeft-5, twelveY, marginLeft+5, twelveY)
    .stroke({color: 'darkgrey', width: 3})

let twelveText = svg.text('1200¢')
    .fill('grey')
    .opacity(0.3)
twelveText.move(marginLeft - (twelveText.length() + 10), twelveY - 8)

let infoText = svg.text('↑ Drag vertically to approximate an interval using the basis intervals.\n→ Dragging further to the right will make this adjustment more fine.')
    .fill('grey')
    .opacity(0.3)
infoText.move(marginLeft+20, zeroY + 20)

let circle = svg.circle(10)
    .center(marginLeft, h - marginBottom)
    .fill('red')
    .stroke('white')
    .opacity(0.8)

let circleText = svg.text('0')
circleText.move(circle.x() - (circleText.length() + 10), circle.cy() - 8)

let arrow = svg.marker(3, 3, function(add) {
    add.polygon([[0, 0], [3, 1.5], [0, 3]]).fill('black')
})


let alignLine = svg.line(marginLeft, zeroY, marginLeft, zeroY)
    .stroke({width: 2, color: 'grey'})
    .opacity(0.2)
    .back()


function randomColor(i) {
    let res = `hsl(${i * 65}, 70%, ${lightnessPercent}%)`
    return res
}

let mouseDown = false
let minX = marginLeft + 100;
let mouseY = zeroY;
let lastY = zeroY;

svg.mousedown(e => {
    mouseDown = true;
    let pt = svg.point(0, e.clientY)
    lastY = pt.y
    svg.css('cursor', 'ns-resize')
})
svg.mouseup(() => { 
    mouseDown = false 
    svg.css('cursor', 'auto')
})

svg.mousemove(e => {
    if (mouseDown) {
        let pt = svg.point(e.clientX, e.clientY)
        let newY = pt.y
        let xDist = Math.max(1, (pt.x - marginLeft) / 10 + 1)
        mouseY += (newY - lastY) / xDist
        mouseY = Math.min(mouseY, zeroY)
        mouseY = Math.max(mouseY, twelveY)
        lastY = newY

        let mouseX = Math.max(pt.x, minX)
        updateCircleY(mouseY, mouseX)
    }
})

function updateCircleY(y, x) {
    y = Math.min(zeroY, y)
    y = Math.max(twelveY, y)
    circle.cy(y)

    let displayY = (zeroY - y) / twelveHeight
    let semitones = Math.floor(displayY * 1199)
    circleText.cy(y)
        .x(circle.x() - (circleText.length() + 10))
        .text(semitones + "¢")

    let [res, octaves] = search(semitones/100, intervals, threshold)
    let localIntervals = [...intervals, tune.FreqRatio(2)]
    //let localIntervalRatios = [...intervalRatios, [2, 1]]
    res = [...res, octaves]
    
    let numSegments = 0
    for (let n of res) numSegments += Math.abs(n)
    let intervalWidth = (x - marginLeft) / numSegments
    if (semitones) {
        $result.text(`${semitones}¢ ≈ `)
        $('#key').show()
    } else {
        $('#key').hide()
        $result.text("")
    }

    let lastPosn = [0, 0]
    let allScaledPoints = []
    for (let i = 0; i < localIntervals.length; i++) {
        let points = [lastPosn]
        let count = Math.abs(res[i])
        let intervalSemi = localIntervals[i].cents() * Math.sign(res[i]) / 100

        for (let j = 0; j < count; j++) {
            let newPosn = [lastPosn[0] + 1, lastPosn[1] + intervalSemi]
            lastPosn = newPosn
            points.push(newPosn)
        }

        let scaledPoints = points.map(([x, y]) => {
            x *= intervalWidth
            x = x + marginLeft
    
            y = zeroY - (y/12) * (zeroY-twelveY)
            return [x, y]
        })

        allScaledPoints.push([scaledPoints, i])
    }
    let pointArr = allScaledPoints[allScaledPoints.length-1][0]
    let posn = pointArr[pointArr.length-1]
    alignLine.plot(marginLeft, y, posn[0], posn[1])

    intervalLines.clear()
    $container.empty()

    for (let [pointArr, idx] of allScaledPoints) {
        let color = randomColor(idx);
        let intervalText = localIntervals[idx].toString()
        let multiplier = res[idx]
        let multiplierText = (multiplier < 0)? '- ' + Math.abs(multiplier) : '+ ' + multiplier
        // first child has no operator
        if (!$container.get(0).children.length) multiplierText = multiplier

        for (let j = 1; j < pointArr.length; j++) {
            drawInterval(...pointArr[j-1], ...pointArr[j], color, intervalText)
        }
        if (multiplier) {
            let $sum = $(`<div>${multiplierText} * ${intervalText}</div>`).css({ color })
            $container.append($sum)
        }
    }
}
let intervalLines = svg.group()

function drawInterval(x1, y1, x2, y2, color, text) {
    if (x1 == x2 && y1 == y2) return

    let g = intervalLines.group().back()
    g.line(x1, y1, x2, y1).stroke({width: 3, color: 'rgb(200, 200, 200)'})/* .marker('end', arrow) */
    g.line(x2, y1, x2, y2).stroke({width: 3, color }).marker('end', arrow).back()
    let t = g.text(text).y((y1 + y2) / 2 - 4).css({'font-size': 10, 'font-weight': 'bold'}).fill(color)
    t.x(x2 - (t.length() + 4))
}

window.drawInterval = drawInterval




/** Turn a string into an interval.
 * 
 *  Valid formats of `text`:
 *   - `"n#d"` = `tune.ETInterval(n, d)`
 *   - `"n:d"` = `tune.FreqRatio(n, d)`
 *   - `"n c"` = `tune.Cents(n)`
*/
export function parseIntervalText(text) {
    let ratioPattern = /^\s*(?<num>[\d\.]+)\s?[:/]\s?(?<den>[\d\.]+)\s*$/
    let etPattern = /^\s*(?<num>-?[\d\.]+)\s?#\s?(?<den>[\d\.]+)\s*$/
    let centPattern = /^\s*(?<cents>-?[\d\.]+)\s*c?$/

    if (ratioPattern.test(text)) {
        let g = ratioPattern.exec(text).groups
        return tune.FreqRatio(parseFloat(g.num), parseFloat(g.den))
    } else if (etPattern.test(text)) {
        let g = etPattern.exec(text).groups
        return tune.ETInterval(parseFloat(g.num), parseFloat(g.den))
    } else if (centPattern.test(text)) {
        let cents = centPattern.exec(text).groups.cents
        return tune.Cents.fromCount(cents)
    }
    return false
}