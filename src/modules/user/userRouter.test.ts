import {beforeEach, describe, expect, it, vi} from "vitest";

const getProfileMock = vi.hoisted(() => vi.fn());

vi.mock("./userController", () => ({
    UserController: class {
        getProfile = getProfileMock;
    },
}));

import {userRoute} from "./userRouter";

describe("userRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("passes authenticated user id to controller", async () => {
        getProfileMock.mockResolvedValue({id: 10, name: "Pavol"});

        const route = userRoute()[0];
        const result = await route.handler({
            auth: {
                credentials: {
                    user_id: 10,
                },
            },
        });

        expect(getProfileMock).toHaveBeenCalledWith({userId: 10});
        expect(result).toEqual({id: 10, name: "Pavol"});
    });
});
