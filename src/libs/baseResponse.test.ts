import {describe, expect, it} from "vitest";
import {BaseResponse} from "./baseResponse";

describe("BaseResponse", () => {
    it("getSuccess returns success object", () => {
        expect(BaseResponse.getSuccess()).toEqual({status: "success"});
    });
});
