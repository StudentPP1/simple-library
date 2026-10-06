FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY SimpleLibrary.API/SimpleLibrary.API.csproj SimpleLibrary.API/
COPY SimpleLibrary.Application/SimpleLibrary.Application.csproj SimpleLibrary.Application/
COPY SimpleLibrary.Core/SimpleLibrary.Core.csproj SimpleLibrary.Core/
COPY SimpleLibrary.DataAccess.Postgres/SimpleLibrary.DataAccess.Postgres.csproj SimpleLibrary.DataAccess.Postgres/
COPY SimpleLibrary.Application.Tests/SimpleLibrary.Application.Tests.csproj SimpleLibrary.Application.Tests/
RUN dotnet restore SimpleLibrary.API/SimpleLibrary.API.csproj \
 && dotnet restore SimpleLibrary.Application.Tests/SimpleLibrary.Application.Tests.csproj

COPY . .
RUN dotnet publish SimpleLibrary.API/SimpleLibrary.API.csproj -c Release -o /app/publish --no-restore

FROM build AS test
ENTRYPOINT ["dotnet", "test", "SimpleLibrary.Application.Tests", "--no-restore"]

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SimpleLibrary.API.dll"]
