export function raspberrySocket(socket){
    console.log('raspberrySocket');
    socket.on('pinChanged', (data)=>{
        console.log('pinChanged->data', data);
    })
}