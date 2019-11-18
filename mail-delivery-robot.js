/* The village of Meadowfield isn't very big. It consists of 11 places with 14 roads between them. It can be described with this array of roads:*/
const roads =
  [
    "Alice's House-Bob's House",
    "Alice's House-Cabin",
    "Alice's House-Post Office",
    "Bob's House-Town Hall",
    "Daria's House-Ernie's House",
    "Daria's House-Town Hall",
    "Ernie's House-Grete's House",
    "Grete's House-Farm",
    "Grete's House-Shop",
    "Marketplace-Farm",
    "Marketplace-Post Office",
    "Marketplace-Shop",
    "Marketplace-Town Hall",
    "Shop-Town Hall"
  ];


function buildGraph(edges) {
  let graph = Object.create(null);

  function addEdge(from, to) {
    if (graph[from] == null) graph[from] = [to];
    else graph[from].push(to);
  }

  for (let [from, to] of edges.map(r => r.split("-"))) {
    addEdge(from, to);
    addEdge(to, from);
  }
  return graph;
}

const roadGraph = buildGraph(roads);

/* Our robot will be moving around the village. There are parcels in various places, each addressed to some other place. The robot picks up parcels when it comes to them and delivers them when it arrives at their destination. The automaton must decide, at each point, where to go next. It has finished its task when all parcels have been delivered.*/

class VillageState {
  constructor(place, parcels) {
    this.place = place;
    this.parcels = parcels;
  }

  move(destination) {
    if (!roadGraph[this.place].includes(destination)) return this;
    else {
      let parcels = this.parcels.map(p => {
        if (p.place != this.place) return p;
        return { place: destination, address: p.address };
      }).filter(p => p.place != p.address);
      return new VillageState(destination, parcels);
    }
  }

  static random(parcelCount = 5) {
    let parcels = [];
    for (let i = 0; i < parcelCount; i++) {
      let address = randomPick(Object.keys(roadGraph));
      let place;
      do {
        place = randomPick(Object.keys(roadGraph));
      } while (place == address);
      parcels.push({ place, address });
    }
    return new VillageState("Post Office", parcels);
  }
}

let place = "Post Office";
let parcels = [{ place: "Post Office", address: "Alice's House" }];

let first = new VillageState(place, parcels);
let next = first.move("Alice's House");

// console.log(next.place);
// console.log(next.parcels);
// console.log(first.place);

function runRobot(state, robot, memory) {
  for (let turn = 0; ; turn++) {
    if (state.parcels.length == 0) {
      // console.log(`Done in ${turn} turns.`);
      return turn;
    }
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
    // console.log(`Moved to ${action.direction}`);
  }
}

function randomPick(array) {
  let choice = Math.floor(Math.random() * array.length)
  return array[choice];
}

function randomRobot(state) {
  return { direction: randomPick(roadGraph[state.place]) };
}
const mailRoute = ["Alice's House", "Cabin", "Alice's House", "Bob's House", "Town Hall", "Daria's House", "Ernie's House", "Grete's House", "Shop", "Grete's House", "Farm", "Marketplace", "Post Office"];

function routeRobot(state, memory) {
  if (memory.length == 0) memory = mailRoute;
  return { direction: memory[0], memory: memory.slice(1) };
}

function findAvgTurns(times, robot, memory) {
  const TIMES = times;
  let total = 0;
  for (let i = 0; i < TIMES; i++) {
    total += runRobot(VillageState.random(), robot, memory);
  }
  return Math.round(total / TIMES);
}

function findRoute(graph, from, to) {
  let work = [{ at: from, route: [] }];
  for (let i = 0; i < work.length; i++) {
    let { at, route } = work[i];
    for (let place of graph[at]) {
      if (place == to) return route.concat(place);
      if (!work.some(w => w.at == place)) {
        work.push({ at: place, route: route.concat(place) });
      }
    }
  }
}

function goalOrientedRobot({ place, parcels }, route) {
  if (route.length == 0) {
    let parcel = parcels[0];
    if (parcel.place != place) {
      route = findRoute(roadGraph, place, parcel.place);
    } else {
      route = findRoute(roadGraph, place, parcel.address)
    }
  }
  return { direction: route[0], memory: route.slice(1) };
}


//console.log(findAvgTurns(1000, goalOrientedRobot, []));
//On average the goalOrientedRobot finishes in 15 turns
//About 4.6 times faster than randomRobot!!
//About 1.2 times faster than routeRobot!!
//console.log(findAvgTurns(100, routeRobot, mailRoute));
//On average the routeRobot finishes in 18 turns
//About 3.8 times faster than randomRobot!!
//console.log(findAvgTurns(100000, randomRobot));
//On average the randomRobot finishes in 69 turns

function compareRobots(robot1, memory1, robot2, memory2) {
  findAvgTurns(100, robot1, memory1, robot2, memory2);
  let total1 = 0, total2 = 0;

  for (let i = 0; i < 100; i++) {
    let state = VillageState.random();
    total1 += runRobot(state, robot1, memory1);
    total2 += runRobot(state, robot2, memory2);
  }
  let avg1 = Math.round(total1 / 100);
  let avg2 = Math.round(total2 / 100);

  console.log(`The average number of steps robot 1 took per task was ${avg1}`);
  console.log(`The average number of steps robot 2 took per task was ${avg2}`);
}

compareRobots(routeRobot, [], goalOrientedRobot, []);


function goalOrientedRobot2({ place, parcels }, route) {
  if (route.length == 0) {
    for (let parcel of parcels) {
      if (parcel.place != place) {
        if (route.length > findRoute(roadGraph, place, parcel.place).length) {
          route = findRoute(roadGraph, place, parcel.place);
        }
      }
    }
    for (let parcel of parcels) {
      route = route.concat(findRoute(roadGraph, place, parcel.address));
    }
  }
  return { direction: route[0], memory: route.slice(1) };
}

console.log(findAvgTurns(10000, goalOrientedRobot2, []));


