import { ECrud, type CRUDConfig } from "./ecrud/ecrud";
import type { BaseEntity } from "./elist/etable";

// Example entity type
interface User extends BaseEntity {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  active: boolean;
  createdAt: Date;
}

// Example CRUD configuration
const userCRUDConfig: CRUDConfig<User> = {
  entityName: "User",
  entityNamePlural: "Users",
  columns: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "active",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ],
  filters: [
    {
      key: "search",
      label: "Search",
      type: "text",
      placeholder: "Search users...",
    },
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "admin", label: "Admin" },
        { value: "user", label: "User" },
      ],
    },
    { key: "active", label: "Status", type: "boolean" },
  ],
  formFields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      options: [
        { value: "admin", label: "Admin" },
        { value: "user", label: "User" },
      ],
    },
    { name: "active", label: "Active", type: "checkbox" },
  ],
  actions: {
    list: {
      create: true,
      view: true,
      edit: true,
      delete: true,
      search: true,
      filter: true,
      sort: true,
      pagination: true,
    },
  },
};

// Example usage component
export const UserManagement = () => {
  // Sample data
  const sampleUsers: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "user",
      active: true,
      createdAt: new Date(),
    },
  ];

  // Handlers
  const handleDataChange = (data: User[]) => {
    console.log("Data changed:", data);
  };

  const handleEntitySelect = (entity: User | null) => {
    console.log("Entity selected:", entity);
  };

  const handleEntitySave = async (entity: User, mode: "create" | "edit") => {
    console.log("Saving entity:", entity, "mode:", mode);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { ...entity, id: entity.id || Date.now().toString() };
  };

  const handleEntityDelete = async (entity: User) => {
    console.log("Deleting entity:", entity);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleLoadData = async (filters: any, pagination: any) => {
    console.log(
      "Loading data with filters:",
      filters,
      "pagination:",
      pagination
    );
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: sampleUsers, total: sampleUsers.length };
  };

  return (
    <div className="p-6">
      <ECrud
        config={userCRUDConfig}
        data={sampleUsers}
        onDataChange={handleDataChange}
        onEntitySelect={handleEntitySelect}
        onEntitySave={handleEntitySave}
        onEntityDelete={handleEntityDelete}
        onLoadData={handleLoadData}
      />
    </div>
  );
};

export default UserManagement;
