declare namespace User {
    interface UserItem {
        id: string
        account: string
        nickName: string
        avatar: string
        email: string
        role: string
        status: number
    }
    interface UserLogin {
        username: string
        password: string
    }

    interface AccountInfo {
        account: string
        avatar: string
        email: string
        id: string
        nickName: string
        role: string
        token: string
    }
}