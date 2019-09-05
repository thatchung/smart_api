const Db = require('./model');

async function userExists(userId) {
	let user = await Db.user.getById(userId);
    return user;
}
exports.userExists = userExists;

async function getDevices(userId) {
    
    const devices = [];
    let home = await Db.device.getByUserId();
    if(!home){
    	return [];
    }
    const querySnapshot = await Db.device.listAllByHomeId(home.id);

    querySnapshot.forEach(doc => {
        const data = doc.val();
        const device = {
            id: data.id,
            type: "action.devices.types.LIGHT",
            traits: {
            	'0' : "action.devices.traits.Brightness",
            	'1' : "action.devices.traits.OnOff",
            	'2' : "action.devices.traits.ColorSetting"
            },
            name: {
                defaultNames: data.name,
                name: data.name,
                nicknames: data.name,
            },
            deviceInfo: {
                manufacturer: data.manufacturer,
                model: data.model,
                hwVersion: data.hwVersion,
                swVersion: data.swVersion,
            },
            willReportState: true,
            attributes: {
            	colorModel: 'rgb'
            },
        };
        devices.push(device);
    });
    return devices;
}
exports.getDevices = getDevices;

async function updateDevice(userId, deviceId, name, nickname, states) {
    
    const updatePayload = {};
    if (name) {
        updatePayload['name'] = name;
    }
    if (nickname) {
        updatePayload['nicknames'] = [nickname];
    }
    if (states) {
        updatePayload['states'] = states;
    }
    console.log("deviceId");
    console.log(deviceId);

    console.log("states");
    console.log(states);
    // yield db.ref(`users/${userId}/devices/${deviceId}`).update(updatePayload);
}
exports.updateDevice = updateDevice;

function addDevice(userId, data) {
    // await db.ref(`users/${userId}/devices/${data.id}`).set(data);
}
exports.addDevice = addDevice;

function deleteDevice(userId, deviceId) {
    // await db.ref(`users/${userId}/devices`).child(deviceId).remove();
}
exports.deleteDevice = deleteDevice;

async function execute(userId, deviceId, execution) {
    const querySnapshot = await Db.device.getByAddress(deviceId);

    if (querySnapshot == null) {
        throw new Error('deviceNotFound')
    }

    const states = {
        online: true,
    }
    const data = querySnapshot;
    console.log(data);
    console.log(execution);
    if (!data["states"].online) {
        throw new Error('deviceOffline')
    }
    switch (execution.command) {
        // action.devices.traits.OnOff
        case 'action.devices.commands.OnOff':
          // yield db.ref(`users/${userId}/devices/${deviceId}/states`).update({
          //   'on': execution.params.on,
          // })
          states['on'] = execution.params.on
          break

        default:
          throw new Error('actionNotAvailable')
      }

      return states;
}
exports.execute = execute;
