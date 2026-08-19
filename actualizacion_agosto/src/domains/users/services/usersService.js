export function findUserById(users, id) {
  return users.find((user) => user.id === id);
}

export function getUserFullName(user) {
  return user ? `${user.nombre} ${user.apellido}` : "-";
}

