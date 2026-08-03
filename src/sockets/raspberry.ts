import {logger} from "../libs/logger";

export function raspberrySocket(socket) {
    logger.debug({socketId: socket.id}, "raspberry connected");
    socket.on("pinChanged", (data) => {
        logger.debug({data}, "pinChanged");
    });
}
