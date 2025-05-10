# Use the official .NET SDK image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set working directory in the container
WORKDIR /src

# First copy just the project file to optimize restore caching
COPY ["BackendApi/BackendApi.csproj", "BackendApi/"]

# Restore dependencies
RUN dotnet restore "BackendApi/BackendApi.csproj"

# Copy the rest of the files
COPY . .

# Build and publish the app
RUN dotnet publish "BackendApi/BackendApi.csproj" -c Release -o /app/publish

# Use the .NET Runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

# Set working directory
WORKDIR /app

# Copy published files from build stage
COPY --from=build /app/publish .

# Expose port 5000
EXPOSE 5000

# Command to start the API
ENTRYPOINT ["dotnet", "BackendApi.dll"]