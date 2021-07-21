exports.protect = profile => {
    if (!profile) {
        return profile
    }
    delete profile.hashPassword
    delete profile.accessToken

    return profile
}
