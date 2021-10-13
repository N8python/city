function generateCityData({
    size,
    roadSeeds: ROAD_SEED_AMT,
    buildings: BUILDINGS_AMT
}) {
    const cityInfo = new Uint8Array(size * size);
    for (let x = -size / 2; x < size / 2; x++) {
        for (let z = -size / 2; z < size / 2; z++) {
            if (Math.hypot(x, z) < size / 2) {
                cityInfo[(x + size / 2) * size + (z + size / 2)] = 1;
            }
        }
    }
    const directionMap = new Uint8Array(size * size);
    let roadSeeds = [];
    for (let i = 0; i < ROAD_SEED_AMT; i++) {
        while (true) {
            let possibleSeed = [Math.floor((Math.random() - 0.5) * size), Math.floor((Math.random() - 0.5) * size)];
            if (Math.hypot(...possibleSeed) < size / 2) {
                roadSeeds[i] = {
                    position: possibleSeed,
                    direction: Math.floor(Math.random() * 4),
                    active: true
                };
                break;
            }
        }
    }
    while (roadSeeds.some(seed => seed.active)) {
        roadSeeds.forEach(roadSeed => {
            if (roadSeed.active) {
                const rdIdx = (roadSeed.position[0] + size / 2) * size + (roadSeed.position[1] + size / 2);
                if (Math.random() < 0.05) {
                    roadSeed.direction += 1;
                    roadSeed.direction %= 4;
                    //directionMap[rdIdx] = 3;
                }
                if (cityInfo[rdIdx] === 2) {
                    if (Math.random() < 0.25) {
                        roadSeed.active = false;
                    }
                }
                if (cityInfo[rdIdx - size] === 2) {
                    if (Math.random() < 0.25) {
                        roadSeed.direction += 1;
                        roadSeed.direction %= 4;
                        //directionMap[rdIdx] = 3;
                    }
                }
                if (cityInfo[rdIdx] === 0 || roadSeed.position[0] < -size / 2 || roadSeed.position[0] >= size / 2 || roadSeed.position[1] < -size / 2 || roadSeed.position[1] >= size / 2) {
                    if (Math.random() < 0.5) {
                        roadSeed.direction += 1;
                        roadSeed.direction %= 4;
                        //directionMap[rdIdx] = 3;
                    } else {
                        roadSeed.active = false;
                    }
                } else {
                    cityInfo[rdIdx] = 2;
                    if (directionMap[rdIdx] === 0) {
                        directionMap[rdIdx] = roadSeed.direction % 2 + 1;
                    } else {
                        //directionMap[rdIdx] = 3;
                    }
                    if (roadSeed.direction === 0) {
                        roadSeed.position[0] += 1;
                    }
                    if (roadSeed.direction === 1) {
                        roadSeed.position[1] += 1;
                    }
                    if (roadSeed.direction === 2) {
                        roadSeed.position[0] -= 1;
                    }
                    if (roadSeed.direction === 3) {
                        roadSeed.position[1] -= 1;
                    }
                }
            }
        })
    }
    const roadMap = new Uint8Array(size * size);
    for (let x = -size / 2 + 1; x < size / 2 - 1; x++) {
        for (let z = -size / 2 + 1; z < size / 2 - 1; z++) {
            const rdIdx = (x + size / 2) * size + (z + size / 2);
            const currDir = directionMap[rdIdx];
            if (currDir === 2) {
                roadMap[rdIdx] = 0b1100;
            } else if (currDir === 1) {
                roadMap[rdIdx] = 0b0011;
            }
            const neighbors = [directionMap[rdIdx - 1], directionMap[rdIdx + 1], directionMap[rdIdx - size], directionMap[rdIdx + size]];
            if (currDir === 1) {
                if (neighbors[0] === 2) {
                    roadMap[rdIdx] |= 0b0100;
                }
                if (neighbors[3] === 2) {
                    roadMap[rdIdx] |= 0b1000;
                }
                if (neighbors[0] === 2) {
                    roadMap[rdIdx] |= 0b0100;
                }
                if (neighbors[1] === 2) {
                    roadMap[rdIdx] |= 0b1000;
                }
            }
            if (currDir === 2) {
                if (neighbors[2] === 1) {
                    roadMap[rdIdx] |= 0b0001;
                }
                if (neighbors[3] === 1) {
                    roadMap[rdIdx] |= 0b0010;
                }
                if (neighbors[0] === 1) {
                    roadMap[rdIdx] |= 0b0001;
                }
                if (neighbors[1] === 1) {
                    roadMap[rdIdx] |= 0b0010;
                }
            }
            /*if (roadMap[rdIdx] & 1) {
                if (neighbors[2] === 0) {
                    roadMap[rdIdx] -= 1;
                }
            }
            if (roadMap[rdIdx] & 2) {
                if (neighbors[3] === 0) {
                    roadMap[rdIdx] -= 2;
                }
            }
            if (roadMap[rdIdx] & 4) {
                if (neighbors[0] === 0) {
                    roadMap[rdIdx] -= 4;
                }
            }
            if (roadMap[rdIdx] & 8) {
                if (neighbors[1] === 0) {
                    roadMap[rdIdx] -= 8;
                }
            }*/
        }
    }
    for (let x = -size / 2 + 1; x < size / 2 - 1; x++) {
        for (let z = -size / 2 + 1; z < size / 2 - 1; z++) {
            const rdIdx = (x + size / 2) * size + (z + size / 2);
            const neighbors = [roadMap[rdIdx - 1], roadMap[rdIdx + 1], roadMap[rdIdx - size], roadMap[rdIdx + size]];
            if (roadMap[rdIdx] & 1) {
                if (!(neighbors[2] & 2)) {
                    roadMap[rdIdx] -= 1;
                }
            }
            if (roadMap[rdIdx] & 2) {
                if (!(neighbors[3] & 1)) {
                    roadMap[rdIdx] -= 2;
                }
            }
            if (roadMap[rdIdx] & 4) {
                if (!(neighbors[0] & 8)) {
                    roadMap[rdIdx] -= 4;
                }
            }
            if (roadMap[rdIdx] & 8) {
                if (!(neighbors[1] & 4)) {
                    roadMap[rdIdx] -= 8;
                }
            }
        }
    }
    let buildings = [];
    const collideRectangles = (rect1, rect2) => {
        const ulx = Math.max(rect1.positionZ, rect2.positionZ);
        const uly = Math.max(rect1.positionX, rect2.positionX);
        const lrx = Math.min(rect1.positionZ + rect1.width, rect2.positionZ + rect2.width);
        const lry = Math.min(rect1.positionX + rect1.height, rect2.positionX + rect2.height);
        return ulx <= lrx && uly <= lry;;
    }

    function generateBuilding() {
        let startPosition;
        let width = 1;
        let height = 1;
        while (true) {
            startPosition = [Math.floor((Math.random() - 0.5) * size), Math.floor((Math.random() - 0.5) * size)];
            width = 1 + Math.floor(Math.random() * 4);
            height = 1 + Math.floor(Math.random() * 4);
            const rdIdx = (startPosition[0] + size / 2) * size + (startPosition[1] + size / 2);
            if (Math.hypot(...startPosition) < size / 2 && cityInfo[rdIdx] === 1) {
                let fit = true;
                for (let z = startPosition[1]; z < startPosition[1] + width; z++) {
                    for (let x = startPosition[0]; x < startPosition[0] + height; x++) {
                        const rdIdx = (x + size / 2) * size + (z + size / 2);
                        if (cityInfo[rdIdx] !== 1) {
                            fit = false;
                        }
                    }
                }
                buildings.forEach(building => {
                    if (collideRectangles(building, {
                            positionX: startPosition[0],
                            positionZ: startPosition[1],
                            width,
                            height
                        })) {
                        fit = false;
                    }
                });
                if (fit) {
                    break;
                }
            }
        }
        return {
            positionX: startPosition[0],
            positionZ: startPosition[1],
            width,
            height
        }
    }
    for (let i = 0; i < BUILDINGS_AMT; i++) {
        buildings.push(generateBuilding());
    }
    return {
        cityMap: cityInfo,
        directionMap: directionMap,
        roadMap: roadMap,
        buildings
    }
}
export default generateCityData;