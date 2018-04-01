/**
 * Created by Emmanuel Ogbizi-Ugbe
 * 26/10/2017
 */

unitKeyMap = {}; // map of units to number key
// takes a length unit (e.g. grade,step)
// then maps and returns the number key
mapUnitKey = function (unit) {
    u = unit.split(",");
    n = Object.keys(unitKeyMap).length + 1; // start from 1
    for (i = 0; i < u.length; i++) {
        k = u[i];
        if (unitKeyMap[k] !== undefined) {
            n = unitKeyMap[k];
            break;
        }
    }
    for (i = 0; i < u.length; i++) {
        k = u[i];
        unitKeyMap[k] = n;
    }
    return n;
}

// load directed unit graph.json => map
map = {};
rmap = {};
bimap = {};
$.getJSON("eng_len_units.json", function (json) {
    map = json;
    //console.log(map);
    // build complete unit key map
    for (t in map) {
        mapUnitKey(t);
        for (u in map[t]) {
            mapUnitKey(u);
        }
    }
    // create reduced map => rmap
    // and bidirectional => bimap
    for (t in map) {
        kT = mapUnitKey(t);
        if (rmap[kT] == undefined) rmap[kT] = {};
        if (bimap[kT] == undefined) bimap[kT] = [];
        for (u in map[t]) {
            kU = mapUnitKey(u);
            rmap[kT][kU] = map[t][u]
            if (bimap[kU] == undefined) bimap[kU] = [];
            bimap[kT].push(kU);
            bimap[kU].push(kT);
        }
    }
    // populate select fields with mapped unit keys
    for (u in unitKeyMap) {
        opt = $("<option>", {
            html: u,
            value: unitKeyMap[u]
        });
        $("#unit-1").append(opt.clone());
        opt.attr("selected", true);
        $("#unit-2").append(opt);
    }
    // set listeners for value changes
    events = "change click keyup";
    update = function (toFieldId, fromFieldId, fromUnitId, toUnitId) {
        $(toFieldId).val(solve($(fromFieldId).val(), $(fromUnitId).val(), $(toUnitId).val()));
    };
    $("#unit-2, #field-1").on(events, function () {
        update("#field-2", "#field-1", "#unit-1", "#unit-2");
    });
    $("#unit-1, #field-2").on(events, function () {
        update("#field-1", "#field-2", "#unit-2", "#unit-1");
    });
});

cache = {}; // cache shortest conversion path
// calculate and return equivalent units
solve = function (val, from, to) {
    try {
        //console.log("solve for", val, "from", from, "to", to);
        key = from + "." + to;
        route = cache[key]; // get path from cache
        if (route == undefined) {
            route = BFS(from, to) // get shortest path
            cache[key] = route;
        }
        //console.log(route);
        /*
        rLookup = {};
        for(n in unitKeyMap) {
            rLookup[unitKeyMap[n]] = n;
        }
        */
        mult = 1;
        for (i = 0; i < (route.length - 1); i++) {
            a = route[i],
                b = route[i + 1];
            //console.log(rLookup[a], "=>", rLookup[b])
            if (a == 0 || b == 0) {
                return val * mult;
            } else if (rmap[a][b] != undefined) {
                mult /= rmap[a][b];
            } else {
                mult *= rmap[b][a];
            }
        }
    } catch (e) {
        mult = 0; // reset
        console.log("caught", e);
        alert("Conversion Failed");
    } finally {
        return (val * mult).toFixed(2) * 1;
    }
};

// function to take source unit and calculate shortest path to destination unit
// using breadth-first-search (BFS)
BFS = function (start, dest) {
    seen = {}; // reset seen
    queue = [start]; // nodes to search, first in first out
    parent = [0]; // node that led to the current node in queue
    /* 
     * First path found is also shortest path
     * as graph is unweighted and undirected
     */
    path = undefined;
    while (queue.length > 0) {
        n = queue.shift();
        p = parent.shift();
        seen[n] = p;
        if (n == dest) {
            path = [n];
            a = p;
            do {
                path.push(a);
                a = seen[a];
            } while (a != 0 && a != undefined);
            break;
        } else {
            for (i = 0; i < bimap[n].length; i++) {
                next = bimap[n][i];
                if (seen[next] == undefined) {
                    queue.push(next);
                    parent.push(n);
                }
            }
        }
    }
    return path;
};