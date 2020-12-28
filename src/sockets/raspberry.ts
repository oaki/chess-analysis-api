export function raspberrySocket(socket){
    console.log('raspberrySocket');
    socket.on('setPin', (data)=>{
        console.log('setPin data', data);
    })
}