export default class User {
    /**
     * Returns whether user is logged in
     * @return {Promise<any>}
     */
    static isLoggedIn() {
        return new Promise((resolve, reject) => {
            fetch(
                '/AJAX/JSON?method=isLoggedIn',
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'GET',
                })
                .then((response) => response.json())
                .then((response) => {
                    if (response.status == 200) {
                        resolve();
                    }
                    reject();
                })
                .catch((error) => {
                    throw error;
                });
        });
    }
}