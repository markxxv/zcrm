import ProfileController from './ProfileController'
import AvatarController from './AvatarController'
import PasswordController from './PasswordController'
import TwoFactorAuthenticationController from './TwoFactorAuthenticationController'

const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
    AvatarController: Object.assign(AvatarController, AvatarController),
    PasswordController: Object.assign(PasswordController, PasswordController),
    TwoFactorAuthenticationController: Object.assign(TwoFactorAuthenticationController, TwoFactorAuthenticationController),
}

export default Settings