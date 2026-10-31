"use client";

import { useEffect, useState } from "react";
import { getAdminRoles, getAdminUsers, type AdminRoleContract, type AdminUserContract } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUserContract[]>([]);
  const [roles, setRoles] = useState<AdminRoleContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!session) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [userResults, roleResults] = await Promise.all([
          getAdminUsers(session.accessToken),
          getAdminRoles(session.accessToken)
        ]);
        setUsers(userResults);
        setRoles(roleResults);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load access data");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [session]);

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operator access</p>
          <h1>Users and roles</h1>
        </div>
        <p>
          Review which operators exist in the system, what roles they hold, and which permissions
          are currently attached to each role before customer-side accounts are introduced later.
        </p>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Email</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="table__empty" colSpan={3}>
                    Loading operators...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={3}>
                    No operator accounts were found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="table__title">
                        <strong>{user.displayName}</strong>
                        <span>{user.id}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.roles.join(" · ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="table__empty" colSpan={3}>
                    Loading roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={3}>
                    No roles were found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="table__title">
                        <strong>{role.name}</strong>
                        <span>{role.id}</span>
                      </div>
                    </td>
                    <td>{role.description ?? "No description yet"}</td>
                    <td>
                      {role.permissions.length > 0
                        ? role.permissions.map((entry) => entry.permission.key).join(", ")
                        : "No permissions assigned"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
