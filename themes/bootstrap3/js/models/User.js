export default class User {
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