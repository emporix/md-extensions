import { Navigate, Route, Routes } from 'react-router'
import UsersAndGroupsPage from './pages/UsersAndGroups.page'
import UserPage from './pages/User.page'
import UsersAndGroupsModule from './UsersAndGroups.module'
import GroupPage from './pages/Group.page'
import { GroupDataProvider } from './context/Group.provider'

const UsersAndGroupsRoutes = () => {
  return (
    <Routes>
      <Route element={<UsersAndGroupsModule />}>
        <Route index element={<UsersAndGroupsPage />} />
        <Route path="users/add" element={<UserPage />} />
        <Route path="users/:userId" element={<UserPage />} />
        <Route
          path="groups/add"
          element={
            <GroupDataProvider>
              <GroupPage />
            </GroupDataProvider>
          }
        />
        <Route
          path="groups/:groupId"
          element={
            <GroupDataProvider>
              <GroupPage />
            </GroupDataProvider>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default UsersAndGroupsRoutes
