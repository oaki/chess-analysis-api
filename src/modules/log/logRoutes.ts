import {LogController} from "./logController";

export function logRoute() {
    return [
        {
            method: "POST",
            path: "/logs/save",
            config: {
                tags: ["api"], // section in documentation
            },
            handler: (request) => {
                console.log({payload: request.payload});
                const payload: string = request.payload;
                return LogController.save({payload});
            }

        }

    ];
}