export class AuthenticationController {

    static async validateJwt(decoded) {
        console.log("validateJwt", decoded, {isValid: !!decoded.user_id});
        return {isValid: !!decoded.user_id};
    }
}